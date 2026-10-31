import { NextRequest, NextResponse } from 'next/server';
import { signInForMobile } from '@/lib/mobile-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '');
    const password = String(body.password || '');
    if (!email.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await signInForMobile(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Email or password is incorrect' }, { status: 401 });
    }
    return NextResponse.json({
      token: user.token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Mobile sign-in error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
