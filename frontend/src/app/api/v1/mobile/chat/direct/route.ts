import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { directKey } from '@/lib/chat';
import { activeUserInGroup } from '@/lib/work-item-access';

export async function POST(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId || userId === actor.id) {
      return NextResponse.json({ error: 'Choose a teammate' }, { status: 400 });
    }
    const teammate = await activeUserInGroup(userId, actor.constructionGroupId);
    if (!teammate) {
      return NextResponse.json({ error: 'That person is not in this construction group' }, { status: 400 });
    }

    const key = directKey(actor.id, userId);
    const channel = await prisma.chatChannel.upsert({
      where: { constructionGroupId_directKey: { constructionGroupId: actor.constructionGroupId, directKey: key } },
      create: { constructionGroupId: actor.constructionGroupId, kind: 'DIRECT', directKey: key },
      update: {},
      select: { id: true },
    });
    return NextResponse.json({ id: channel.id });
  } catch (error) {
    console.error('Mobile open direct chat error:', error);
    return NextResponse.json({ error: 'Could not open the chat. Try again in a moment.' }, { status: 500 });
  }
}
