import crypto from 'crypto';
import { prisma } from './prisma';
import { sendEmail } from './email';

const recentHits = new Map<string, number[]>();

export function passwordStamp(passwordHash: string) {
  return crypto.createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export function resetRequestLimited(key: string, windowMs: number, max: number) {
  const now = Date.now();
  const hits = (recentHits.get(key) || []).filter((time) => now - time < windowMs);
  if (hits.length >= max) {
    recentHits.set(key, hits);
    return true;
  }
  hits.push(now);
  recentHits.set(key, hits);
  return false;
}

export async function sendPasswordResetLink(
  user: { email: string; name: string | null },
  hours: number,
) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `password-reset:${user.email}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${user.email}`,
      token: resetToken,
      expires: resetExpires,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'https://ldctools.com';
  const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;
  const expiryLabel = hours === 1 ? '1 hour' : `${hours} hours`;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - LDC Tools',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">
            ${user.name ? `Dear ${user.name},` : 'Hello,'}
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            A password reset has been requested for your LDC Tools account. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>This link expires in ${expiryLabel} and works once.</strong>
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
            If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
      </div>
    `,
  });
}

/** Sends a reset link when the address belongs to an account that can sign in. Never reports whether it did. */
export async function requestSelfServicePasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: { email: true, name: true, status: true, passwordHash: true },
  });

  if (!user?.passwordHash || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    return;
  }

  const sent = await sendPasswordResetLink(user, 1);
  if (!sent) {
    console.error('Password reset email was not sent for a matching account');
  }
}
