import { NextRequest, NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/admin-notice';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.company === 'string' && body.company.trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const kind = body.kind === 'access' ? 'access' : 'help';
    if (!name || name.length > 120 || !EMAIL.test(email) || message.length < 8 || message.length > 2000) {
      return NextResponse.json({ error: 'Enter your name, a valid email, and a short message.' }, { status: 400 });
    }

    const text = [
      kind === 'access' ? 'Access request' : 'Support request',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message,
    ].join('\n');
    await notifyAdmins({
      action: kind === 'access' ? 'ACCESS_REQUEST' : 'SUPPORT_REQUEST',
      resource: 'support',
      subject: kind === 'access' ? 'LDC Tools access request' : 'LDC Tools support request',
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Public support error:', error);
    return NextResponse.json({ error: 'Could not send that. Try again in a moment.' }, { status: 500 });
  }
}
