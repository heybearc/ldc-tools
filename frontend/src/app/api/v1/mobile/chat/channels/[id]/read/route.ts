import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { channelForMember } from '@/lib/chat';

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
    await prisma.chatRead.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: actor.id } },
      create: { channelId: channel.id, userId: actor.id },
      update: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile mark chat read error:', error);
    return NextResponse.json({ error: 'Could not update the chat. Try again in a moment.' }, { status: 500 });
  }
}
