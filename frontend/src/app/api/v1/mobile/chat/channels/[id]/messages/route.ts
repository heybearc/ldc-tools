import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { blockedUserIds, channelForMember, notifyChannel } from '@/lib/chat';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const channel = await channelForMember(params.id, actor.id, actor.constructionGroupId);
    if (!channel) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const after = request.nextUrl.searchParams.get('after');
    const blocked = await blockedUserIds(actor.id);
    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: channel.id,
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        author: message.author,
        mine: message.authorId === actor.id,
      })),
    });
  } catch (error) {
    console.error('Mobile list messages error:', error);
    return NextResponse.json({ error: 'Could not load messages. Try again in a moment.' }, { status: 500 });
  }
}

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
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) return NextResponse.json({ error: 'Write a message' }, { status: 400 });
    if (text.length > 4000) return NextResponse.json({ error: 'That message is too long' }, { status: 400 });

    const message = await prisma.chatMessage.create({
      data: { channelId: channel.id, authorId: actor.id, body: text },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    await prisma.chatRead.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: actor.id } },
      create: { channelId: channel.id, userId: actor.id },
      update: { readAt: new Date() },
    });
    notifyChannel({
      channelId: channel.id,
      constructionGroupId: channel.constructionGroupId,
      kind: channel.kind,
      directKey: channel.directKey,
      authorId: actor.id,
      authorName: actor.name || message.author.name || message.author.email,
      body: text,
    }).catch((error) => console.error('Chat push failed:', error));

    return NextResponse.json({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      author: message.author,
      mine: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Mobile send message error:', error);
    return NextResponse.json({ error: 'Could not send the message. Try again in a moment.' }, { status: 500 });
  }
}
