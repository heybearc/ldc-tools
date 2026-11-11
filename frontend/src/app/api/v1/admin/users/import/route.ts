import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin, resolvePlatformRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { decryptPassword } from '@/lib/email-crypto';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const headers = lines[0].split(',').map(h => h.trim());
    
    const cgScope = await getCGScope();
    let imported = 0;
    let invited = 0;
    const errors: string[] = [];

    // Get email configuration for sending invitations
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    let transporter = null;
    if (emailConfig) {
      const decryptedPassword = decryptPassword(emailConfig.smtpPassword);
      const transportConfig: any = {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.encryption === 'ssl',
        auth: {
          user: emailConfig.smtpUser,
          pass: decryptedPassword
        }
      };
      if (emailConfig.encryption === 'tls') {
        transportConfig.tls = { ciphers: 'SSLv3' };
      }
      transporter = nodemailer.createTransport(transportConfig);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const { name, email, role, volunteerId, status } = row;
        
        if (!email || !role) {
          errors.push(`Row ${i + 1}: Missing required fields (email, role)`);
          continue;
        }

        const access = resolvePlatformRole(String(role));
        if (!access) {
          errors.push(`Row ${i + 1}: Role must be USER, ADMIN, SUPER_ADMIN, or READ_ONLY`);
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          errors.push(`Row ${i + 1}: User ${email} already exists`);
          continue;
        }

        // If volunteerId provided, verify it exists and get CG from volunteer
        let constructionGroupId = null;
        if (volunteerId) {
          const volunteer = await prisma.volunteer.findUnique({
            where: { id: volunteerId },
            select: { constructionGroupId: true }
          });
          
          if (!volunteer) {
            errors.push(`Row ${i + 1}: Volunteer ${volunteerId} not found`);
            continue;
          }
          
          constructionGroupId = volunteer.constructionGroupId;
        } else {
          // For users without a volunteer link, use the importing admin's CG
          constructionGroupId = cgScope?.constructionGroupId || null;
        }

        const userStatus = status?.toUpperCase() || 'INVITED';
        const shouldSendInvite = userStatus === 'INVITED';

        // Generate invitation token if status is INVITED
        let inviteToken = null;
        let inviteExpires = null;
        if (shouldSendInvite) {
          inviteToken = crypto.randomBytes(32).toString('hex');
          inviteExpires = new Date();
          inviteExpires.setDate(inviteExpires.getDate() + 7);
        }

        // Create user
        const newUser = await prisma.user.create({
          data: {
            name: name || null,
            email,
            role: access.role,
            ...(access.adminLevel ? { adminLevel: access.adminLevel } : {}),
            status: userStatus as 'ACTIVE' | 'INVITED' | 'INACTIVE',
            volunteerId: volunteerId || null,
            constructionGroupId,
            emailVerified: userStatus === 'ACTIVE' ? new Date() : null,
            invitedBy: cgScope?.userId,
            invitedAt: shouldSendInvite ? new Date() : null,
          }
        });

        // Create invitation record if status is INVITED
        if (shouldSendInvite && inviteToken && inviteExpires) {
          await prisma.userInvitation.create({
            data: {
              email,
              firstName: name?.split(' ')[0] || '',
              lastName: name?.split(' ').slice(1).join(' ') || '',
              role: access.role,
              invitationToken: inviteToken,
              expiresAt: inviteExpires,
              status: 'PENDING',
              invitedBy: cgScope?.userId || null,
            }
          });

          // Auto-send invitation email
          if (transporter && emailConfig) {
            try {
              const baseUrl = process.env.NEXTAUTH_URL || 'https://ldctools.com';
              const inviteLink = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

              await transporter.sendMail({
                from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
                to: email,
                subject: 'Invitation to LDC Tools',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
                      <h1 style="margin: 0;">You're Invited!</h1>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f9fafb;">
                      <p style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">
                        ${name ? `Dear ${name},` : 'Hello,'}
                      </p>
                      
                      <p style="color: #4b5563; line-height: 1.6;">
                        You've been invited to join the LDC Tools platform. Click the button below to accept your invitation and set up your account.
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
              invited++;
            } catch (emailError) {
              console.error(`Failed to send invitation to ${email}:`, emailError);
              errors.push(`Row ${i + 1}: User created but failed to send invitation email to ${email}`);
            }
          }
        }

        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      imported,
      invited,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} users${invited > 0 ? `, sent ${invited} invitation emails` : ''}`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import users', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
