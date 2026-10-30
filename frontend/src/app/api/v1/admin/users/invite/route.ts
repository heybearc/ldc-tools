import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { decryptPassword } from '@/lib/email-crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, role } = body;
    
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Get CG scope and current user
    const cgScope = await getCGScope();
    if (!cgScope) {
      return NextResponse.json(
        { error: 'Unable to determine user context' },
        { status: 500 }
      );
    }

    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Email is not set up yet. Open Admin → Email Configuration, then try again.' },
        { status: 500 }
      );
    }

    // Generate a random token for the invitation
    const crypto = require('crypto');
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7); // 7 days expiry

    // Create the user with INVITED status
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        role,
        status: 'INVITED',
        ...(cgScope?.constructionGroupId && {
          constructionGroup: {
            connect: { id: cgScope.constructionGroupId }
          }
        }),
        emailVerified: null,
        invitedBy: cgScope.userId,
        invitedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    // Also create the user invitation record for tracking
    const invitation = await prisma.userInvitation.create({
      data: {
        email,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        role,
        invitedBy: cgScope.userId,
        invitationToken: inviteToken,
        expiresAt: inviteExpires,
        status: 'PENDING',
      },
    });

    // Decrypt the password using proper decryption
    const password = decryptPassword(emailConfig.appPasswordEncrypted || '');

    // Create transporter based on configuration
    const transportConfig: any = {
      host: emailConfig.smtpHost || '',
      port: emailConfig.smtpPort || 587,
      secure: emailConfig.encryption === 'ssl',
      auth: {
        user: emailConfig.username || '',
        pass: password
      }
    };

    // Add TLS configuration for STARTTLS
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
    const greeting = name ? `Dear ${name},` : 'Hello,';

    try {
    // Send invitation email
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: email,
      subject: 'You\'ve been invited to LDC Tools',
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
              You've been invited to join LDC Tools as a <strong>${role}</strong>.
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
    } catch (mailError) {
      await prisma.userInvitation.delete({ where: { id: invitation.id } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: newUser.id } }).catch(() => undefined);
      console.error('Invite email failed:', mailError);
      return NextResponse.json(
        { error: 'The invitation email could not be sent. Nothing was saved. Check Email Configuration and try again.' },
        { status: 502 }
      );
    }

    // Mark invitation as sent
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { sentAt: new Date() }
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
