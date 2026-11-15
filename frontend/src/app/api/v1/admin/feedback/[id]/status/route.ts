import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth-helpers';
import { sendEmail, generateFeedbackStatusChangeEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, resolutionComment } = body;

    const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const normalized = String(status || '').toUpperCase();
    if (!validStatuses.includes(normalized)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Get current feedback with submitter info
    const currentFeedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!currentFeedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    // Require resolution comment when marking as RESOLVED (D-024 compliance)
    // Allow existing resolution comment to satisfy requirement
    if (normalized === 'RESOLVED') {
      const hasExistingComment = currentFeedback.resolutionComment?.trim();
      const hasNewComment = resolutionComment?.trim();
      
      if (!hasExistingComment && !hasNewComment) {
        return NextResponse.json({ 
          success: false, 
          error: 'Resolution comment is required when marking feedback as RESOLVED' 
        }, { status: 400 });
      }
    }

    const oldStatus = currentFeedback.status;
    const newStatus = normalized as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: { 
        status: newStatus,
        // Keep existing resolution comment if no new one provided
        resolutionComment: resolutionComment?.trim() || currentFeedback.resolutionComment || null
      }
    });

    if (oldStatus !== newStatus && currentFeedback.user?.email) {
      const recipient = currentFeedback.user.email;
      const recipientName = currentFeedback.user.name || 'User';
      const title = currentFeedback.title;
      const feedbackId = currentFeedback.id;
      void (async () => {
        try {
          const emailHtml = generateFeedbackStatusChangeEmail(title, oldStatus, newStatus, feedbackId, recipientName);
          await sendEmail({
            to: recipient,
            subject: `Feedback Status Updated: ${title}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error('Failed to send status change email:', emailError);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...feedback,
        status: feedback.status.toLowerCase(),
        feedbackNumber: currentFeedback.feedbackNumber,
      },
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
