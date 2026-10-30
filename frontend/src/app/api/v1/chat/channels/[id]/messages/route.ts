import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { notifyChannel } from '@/lib/chat';

async function loadChannel(id: string, userId: string) {
  const scope = await getCGScope();
  if (!scope?.constructionGroupId) return { error: NextResponse.json({ error: 'No construction group assigned' }, { status: 403 }) };
  const channel = await prisma.chatChannel.findUnique({ where: { id } });
  if (!channel || !canAccessCG(scope, channel.constructionGroupId)) {
    return { error: NextResponse.json({ error: 'Chat not found' }, { status: 404 }) };
  }
  if (channel.kind === 'DIRECT' && !channel.directKey.split(':').includes(userId)) {
    return { error: NextResponse.json({ error: 'Chat not found' }, { status: 404 }) };
  }
  return { channel, scope };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loaded = await loadChannel(params.id, session.user.id);
    if ('error' in loaded && loaded.error) return loaded.error;

    const after = request.nextUrl.searchParams.get('after');
    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: params.id,
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
        mine: message.authorId === session.user.id,
      })),
    });
  } catch (error) {
    console.error('List chat messages error:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loaded = await loadChannel(params.id, session.user.id);
    if (!('channel' in loaded) || !loaded.channel) return loaded.error;

    const body = await request.json();
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) return NextResponse.json({ error: 'Write a message' }, { status: 400 });
    if (text.length > 4000) return NextResponse.json({ error: 'That message is too long' }, { status: 400 });

    const message = await prisma.chatMessage.create({
      data: { channelId: loaded.channel.id, authorId: session.user.id, body: text },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    await prisma.chatRead.upsert({
      where: { channelId_userId: { channelId: loaded.channel.id, userId: session.user.id } },
      create: { channelId: loaded.channel.id, userId: session.user.id },
      update: { readAt: new Date() },
    });

    const authorName = session.user.name || message.author.name || message.author.email;
    notifyChannel({
      channelId: loaded.channel.id,
      constructionGroupId: loaded.channel.constructionGroupId,
      kind: loaded.channel.kind,
      directKey: loaded.channel.directKey,
      authorId: session.user.id,
      authorName,
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
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Failed to send the message' }, { status: 500 });
  }
}
