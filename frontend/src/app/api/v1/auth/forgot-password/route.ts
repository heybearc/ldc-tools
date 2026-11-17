import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestSelfServicePasswordReset, resetRequestLimited } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

const SAME_ANSWER = {
  message: 'If an account exists for that email, a reset link is on its way. It expires in one hour.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();

    if (!email.includes('@') || email.length > 200) {
      return NextResponse.json({ error: 'Enter the email on the account.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (
      resetRequestLimited(`reset-email:${email.toLowerCase()}`, 10 * 60 * 1000, 1) ||
      resetRequestLimited(`reset-ip:${ip}`, 60 * 60 * 1000, 8)
    ) {
      return NextResponse.json(
        { error: 'Please wait a few minutes before requesting another reset email.' },
        { status: 429 },
      );
    }

    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Password reset email is not available right now. Ask an administrator for help.' },
        { status: 503 },
      );
    }

    await requestSelfServicePasswordReset(email);
    return NextResponse.json(SAME_ANSWER);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(SAME_ANSWER);
  }
}
