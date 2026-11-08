import { NextRequest, NextResponse } from 'next/server';
import { requireMobileActor } from '@/lib/mobile-actor';
import { removeExpoPushToken, saveExpoPushToken } from '@/lib/expo-push';

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    try {
      await saveExpoPushToken(access.actor.id, token);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the phone' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Save phone token error:', error);
    return NextResponse.json({ error: 'Could not turn on phone notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const token = request.nextUrl.searchParams.get('token') || undefined;
    await removeExpoPushToken(access.actor.id, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Remove phone token error:', error);
    return NextResponse.json({ error: 'Could not turn off phone notifications' }, { status: 500 });
  }
}
