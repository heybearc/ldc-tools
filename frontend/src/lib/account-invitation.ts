import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decryptPassword } from '@/lib/email-crypto';

type InviteResult =
  | { ok: true; email: string }
  | { ok: false; status: number; error: string };

export async function sendAccountInvitation(userId: string, invitedBy: string): Promise<InviteResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      invitedAt: true,
    },
  });

  if (!user) {
    return { ok: false, status: 404, error: 'User not found' };
  }

  if (user.emailVerified) {
    return { ok: false, status: 400, error: 'This person already set up their account.' };
  }

  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
  });

  if (!emailConfig) {
    return { ok: false, status: 500, error: 'Email is not set up yet. Open Admin → Email Configuration, then try again.' };
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpires = new Date();
  inviteExpires.setDate(inviteExpires.getDate() + 7);
  const reminder = Boolean(user.invitedAt);

  const existingInvitation = await prisma.userInvitation.findFirst({
    where: { email: user.email },
    orderBy: { createdAt: 'desc' },
  });

  if (existingInvitation) {
    await prisma.userInvitation.update({
      where: { id: existingInvitation.id },
      data: {
        invitationToken: inviteToken,
        expiresAt: inviteExpires,
        status: 'PENDING',
        sentAt: null,
        role: user.role,
      },
    });
  } else {
    await prisma.userInvitation.create({
      data: {
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        role: user.role,
        invitedBy,
        invitationToken: inviteToken,
        expiresAt: inviteExpires,
        status: 'PENDING',
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'INVITED',
      emailVerified: null,
      invitedBy,
      invitedAt: new Date(),
    },
  });

  const password = decryptPassword(emailConfig.appPasswordEncrypted || '');
  const transportConfig: Record<string, unknown> = {
    host: emailConfig.smtpHost || '',
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username || '',
      pass: password,
    },
  };

  if (emailConfig.encryption === 'tls') {
    transportConfig.tls = { ciphers: 'SSLv3' };
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ldctools.com';
  const inviteLink = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;
  const greeting = user.name ? `Dear ${user.name},` : 'Hello,';
  const access = user.role.replace(/_/g, ' ');

  try {
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: user.email,
      subject: reminder ? 'Reminder: You\'ve been invited to LDC Tools' : 'You\'ve been invited to LDC Tools',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to LDC Tools</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">${greeting}</p>
            <h2 style="color: #1f2937;">You've been invited!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              You've been invited to join LDC Tools as <strong>${access}</strong>.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Click the button below to accept your invitation and set up your account:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Accept Invitation</a>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>This invitation will expire in 7 days.</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Account invitation email failed:', error);
    return { ok: false, status: 502, error: 'The invitation email could not be sent. Check Email Configuration and try again.' };
  }

  const invitation = await prisma.userInvitation.findFirst({
    where: { email: user.email },
    orderBy: { createdAt: 'desc' },
  });
  if (invitation) {
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: {
        sentAt: new Date(),
        remindersSent: reminder ? (invitation.remindersSent || 0) + 1 : invitation.remindersSent,
      },
    });
  }

  return { ok: true, email: user.email };
}
