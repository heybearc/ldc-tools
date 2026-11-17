import { NextRequest, NextResponse } from 'next/server';
import { requireMobileActor } from '@/lib/mobile-actor';
import { availableWorkCountForUser } from '@/lib/work-available-notify';

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const count = await availableWorkCountForUser(access.actor.id, access.actor.constructionGroupId);
    return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Mobile available work count error:', error);
    return NextResponse.json({ error: 'Could not load available work' }, { status: 500 });
  }
}
