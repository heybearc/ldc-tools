import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { decryptPassword } from '@/lib/email-crypto';
import nodemailer from 'nodemailer';
import { canEmailAddress } from '@/lib/reachable-email';

// GET - Get single request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const crewRequest = await prisma.crewChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        completedBy: { select: { id: true, name: true } }
      }
    });

    if (!crewRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: crewRequest.id,
      request_type: crewRequest.requestType,
      requestor_name: crewRequest.requestorName,
      requestor_email: crewRequest.requestorEmail,
      volunteer_name: crewRequest.volunteerName,
      volunteer_ba_id: crewRequest.volunteerBaId,
      crew_name: crewRequest.crewName,
      project_roster_name: crewRequest.projectRosterName,
      comments: crewRequest.comments,
      status: crewRequest.status,
      assigned_to: crewRequest.assignedTo,
      resolution_notes: crewRequest.resolutionNotes,
      completed_at: crewRequest.completedAt?.toISOString() || null,
      completed_by: crewRequest.completedBy,
      created_at: crewRequest.createdAt.toISOString(),
      updated_at: crewRequest.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Get crew request error:', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}

// PATCH - Update request (assign, change status, complete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, constructionGroupId: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, assigned_to_id, resolution_notes, send_completion_email, notify_requestor } = body;

    // Get the current request for email notification
    const currentRequest = await prisma.crewChangeRequest.findUnique({
      where: { id: params.id }
    });

    if (!currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedById = user.id;
      }
    }

    if (assigned_to_id !== undefined) {
      updateData.assignedToId = assigned_to_id || null;
      if (assigned_to_id && updateData.status !== 'COMPLETED') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    if (resolution_notes !== undefined) {
      updateData.resolutionNotes = resolution_notes;
    }

    if (typeof notify_requestor === 'boolean') {
      updateData.notifyRequestor = notify_requestor;
    }

    const updated = await prisma.crewChangeRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        completedBy: { select: { id: true, name: true } }
      }
    });

    // Send completion email if requested
    if (status === 'COMPLETED' && send_completion_email && currentRequest.notifyRequestor !== false) {
      try {
        await sendCompletionEmail(currentRequest, resolution_notes, user.name || 'Personnel Team');
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      id: updated.id,
      request_type: updated.requestType,
      requestor_name: updated.requestorName,
      requestor_email: updated.requestorEmail,
      volunteer_name: updated.volunteerName,
      volunteer_ba_id: updated.volunteerBaId,
      crew_name: updated.crewName,
      project_roster_name: updated.projectRosterName,
      comments: updated.comments,
      status: updated.status,
      assigned_to: updated.assignedTo,
      resolution_notes: updated.resolutionNotes,
      completed_at: updated.completedAt?.toISOString() || null,
      completed_by: updated.completedBy,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Update crew request error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

// DELETE - Delete a crew request (Personnel Contact roles only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and their volunteer record to check organizational roles
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        volunteerId: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has Personnel Contact role (PC, PCA, PC-Support)
    if (user.volunteerId) {
      const personnelRoles = await prisma.volunteerRole.findFirst({
        where: {
          volunteerId: user.volunteerId,
          roleCode: { in: ['PC', 'PCA', 'PC-Support'] },
          endDate: null
        }
      });

      if (!personnelRoles) {
        return NextResponse.json({ error: 'Only Personnel Contact roles can delete requests' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Only Personnel Contact roles can delete requests' }, { status: 403 });
    }

    // Delete the request
    await prisma.crewChangeRequest.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete crew request error:', error);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}

// Helper function to send completion email
async function sendCompletionEmail(
  request: any,
  resolutionNotes: string | null,
  completedByName: string
) {
  if (!canEmailAddress(request.requestorEmail, request.notifyRequestor !== false)) {
    return;
  }
  // Get email configuration
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true }
  });

  if (!emailConfig) {
    console.log('No email configuration found, skipping notification');
    return;
  }

  const REQUEST_TYPE_LABELS: Record<string, string> = {
    ADD_TO_CREW: 'Add Volunteer to Crew',
    REMOVE_FROM_CREW: 'Remove Volunteer from Crew',
    ADD_TO_PROJECT_ROSTER: 'Add Volunteer to Project Roster',
  };

  const transportConfig: any = {
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username,
      pass: decryptPassword(emailConfig.appPasswordEncrypted || '')
    }
  };

  if (emailConfig.encryption === 'tls') {
    transportConfig.tls = { ciphers: 'SSLv3' };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
    to: request.requestorEmail,
    subject: `✅ Crew Request Completed - ${request.volunteerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Request Completed</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="color: #1f2937; font-size: 16px;">Hello ${request.requestorName},</p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Your crew change request has been completed by the Personnel Team.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #1f2937; margin-top: 0;">Request Details:</h3>
            <ul style="color: #6b7280; line-height: 1.8; list-style: none; padding: 0;">
              <li><strong>Volunteer:</strong> ${request.volunteerName}</li>
              <li><strong>Request Type:</strong> ${REQUEST_TYPE_LABELS[request.requestType] || request.requestType}</li>
              ${request.crewName ? `<li><strong>Crew:</strong> ${request.crewName}</li>` : ''}
              ${request.projectRosterName ? `<li><strong>Project:</strong> ${request.projectRosterName}</li>` : ''}
              <li><strong>Completed By:</strong> ${completedByName}</li>
              <li><strong>Completed On:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}</li>
            </ul>
            ${resolutionNotes ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <strong style="color: #1f2937;">Notes:</strong>
                <p style="color: #6b7280; margin: 5px 0 0 0;">${resolutionNotes}</p>
              </div>
            ` : ''}
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for your patience. If you have any questions, please contact the Personnel Team.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px;">
              LDC Tools - Personnel Team<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Request Completed
      
      Hello ${request.requestorName},
      
      Your crew change request has been completed by the Personnel Team.
      
      Request Details:
      - Volunteer: ${request.volunteerName}
      - Request Type: ${REQUEST_TYPE_LABELS[request.requestType] || request.requestType}
      ${request.crewName ? `- Crew: ${request.crewName}` : ''}
      ${request.projectRosterName ? `- Project: ${request.projectRosterName}` : ''}
      - Completed By: ${completedByName}
      - Completed On: ${new Date().toLocaleString()}
      ${resolutionNotes ? `\nNotes: ${resolutionNotes}` : ''}
      
      Thank you for your patience. If you have any questions, please contact the Personnel Team.
      
      LDC Tools - Personnel Team
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Completion email sent to ${request.requestorEmail}`);
}
