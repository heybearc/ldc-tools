import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { userInGroupWhere } from '@/lib/work-item-access';

export async function GET(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const blocks = await prisma.chatBlock.findMany({
      where: { userId: actorResult.actor.id },
      include: { blocked: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      blocks: blocks.map((block) => block.blocked),
    });
  } catch (error) {
    console.error('Mobile list blocks error:', error);
    return NextResponse.json({ error: 'Could not load blocked people. Try again in a moment.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId || userId === actor.id) {
      return NextResponse.json({ error: 'Choose someone else to block' }, { status: 400 });
    }

    const person = await prisma.user.findFirst({
      where: { id: userId, ...userInGroupWhere(actor.constructionGroupId) },
      select: { id: true },
    });
    if (!person) return NextResponse.json({ error: 'That person is not in this group' }, { status: 404 });

    await prisma.chatBlock.upsert({
      where: { userId_blockedUserId: { userId: actor.id, blockedUserId: userId } },
      create: { userId: actor.id, blockedUserId: userId },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile block error:', error);
    return NextResponse.json({ error: 'Could not block that person. Try again in a moment.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId) return NextResponse.json({ error: 'Choose someone to unblock' }, { status: 400 });

    await prisma.chatBlock.deleteMany({
      where: { userId: actorResult.actor.id, blockedUserId: userId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile unblock error:', error);
    return NextResponse.json({ error: 'Could not unblock that person. Try again in a moment.' }, { status: 500 });
  }
}
