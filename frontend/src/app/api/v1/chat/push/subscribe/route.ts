import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : '';
    const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : '';
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Notification setup was incomplete' }, { status: 400 });
    }
    await prisma.chatPushSubscription.upsert({
      where: { endpoint },
      create: { userId: session.user.id, endpoint, p256dh, auth },
      update: { userId: session.user.id, p256dh, auth },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Save chat push subscription error:', error);
    return NextResponse.json({ error: 'Failed to turn on notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    if (endpoint) {
      await prisma.chatPushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Remove chat push subscription error:', error);
    return NextResponse.json({ error: 'Failed to turn off notifications' }, { status: 500 });
  }
}
