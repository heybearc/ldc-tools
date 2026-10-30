import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { decryptPassword } from '@/lib/email-crypto';
import nodemailer from 'nodemailer';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 'INVITED') {
      return NextResponse.json(
        { error: 'Can only resend invitations to users with INVITED status' },
        { status: 400 }
      );
    }

    // Generate new invitation token
    const crypto = require('crypto');
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7); // 7 days expiry

    // Update or create UserInvitation record
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' }
    });

    if (existingInvitation) {
      await prisma.userInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          invitationToken: inviteToken,
          expiresAt: inviteExpires,
          status: 'PENDING',
          sentAt: null,
          remindersSent: 0,
        }
      });
    } else {
      await prisma.userInvitation.create({
        data: {
          email: user.email,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          role: user.role,
          invitedBy: session.user?.id || '',
          invitationToken: inviteToken,
          expiresAt: inviteExpires,
          status: 'PENDING',
        }
      });
    }

    // Get email configuration
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Email configuration not found' },
        { status: 500 }
      );
    }

    // Decrypt password and create transporter
    const password = decryptPassword(emailConfig.appPasswordEncrypted || '');

    const transportConfig: any = {
      host: emailConfig.smtpHost || '',
      port: emailConfig.smtpPort || 587,
      secure: emailConfig.encryption === 'ssl',
      auth: {
        user: emailConfig.username || '',
        pass: password
      }
    };

    if (emailConfig.encryption === 'tls') {
      transportConfig.tls = {
        ciphers: 'SSLv3'
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Generate invitation link - always use production URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ldctools.com';
    const inviteLink = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

    // Personalize greeting
    const greeting = user.name ? `Dear ${user.name},` : 'Hello,';

    // Send invitation email
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: user.email,
      subject: 'Reminder: You\'ve been invited to LDC Tools',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to LDC Tools</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">
              ${greeting}
            </p>
            
            <h2 style="color: #1f2937;">You've been invited!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              This is a reminder that you've been invited to join LDC Tools as a <strong>${user.role}</strong>.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Click the button below to accept your invitation and set up your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Accept Invitation</a>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏰ This invitation will expire in 7 days.</strong>
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    // Mark invitation as sent
    const invitation = await prisma.userInvitation.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' }
    });

    if (invitation) {
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { 
          sentAt: new Date(),
          remindersSent: (invitation.remindersSent || 0) + 1
        }
      });
    }

    return NextResponse.json({
      message: 'Invitation resent successfully',
      user: {
        id: user.id,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
