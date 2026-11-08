import { NextRequest, NextResponse } from 'next/server';
import { requireMobileActor } from '@/lib/mobile-actor';
import { channelForMember, setChannelRead } from '@/lib/chat';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const channel = await channelForMember(params.id, actor.id, actor.constructionGroupId);
    if (!channel) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const unread = await setChannelRead(channel.id, actor.id, Boolean(body.unread));
    return NextResponse.json({ ok: true, unread });
  } catch (error) {
    console.error('Mobile mark chat read error:', error);
    return NextResponse.json({ error: 'Could not update the chat. Try again in a moment.' }, { status: 500 });
  }
}
