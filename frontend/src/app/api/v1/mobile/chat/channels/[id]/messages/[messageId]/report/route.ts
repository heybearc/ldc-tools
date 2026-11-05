import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { channelForMember } from '@/lib/chat';
import { notifyAdmins } from '@/lib/admin-notice';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const channel = await channelForMember(params.id, actor.id, actor.constructionGroupId);
    if (!channel) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const message = await prisma.chatMessage.findFirst({
      where: { id: params.messageId, channelId: channel.id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!message) return NextResponse.json({ error: 'That message is no longer here' }, { status: 404 });
    if (message.authorId === actor.id) {
      return NextResponse.json({ error: 'Report a message from someone else' }, { status: 400 });
    }

    const excerpt = message.body.slice(0, 500);
    const author = message.author.name || message.author.email;
    const description = [
      `Reported by ${actor.name || actor.email} (${actor.email}).`,
      `Author: ${author} (${message.author.email}).`,
      `Message id: ${message.id}.`,
      '',
      excerpt,
    ].join('\n');

    const lastFeedback = await prisma.feedback.findFirst({
      orderBy: { feedbackNumber: 'desc' },
      select: { feedbackNumber: true },
    });
    const match = lastFeedback?.feedbackNumber.match(/^FB-(\d+)$/);
    const feedbackNumber = `FB-${String((match ? parseInt(match[1], 10) : 0) + 1).padStart(3, '0')}`;

    await prisma.feedback.create({
      data: {
        feedbackNumber,
        type: 'QUESTION',
        title: `Chat report from ${actor.name || actor.email}`,
        description,
        priority: 'HIGH',
        submittedBy: actor.id,
      },
    });
    await notifyAdmins({
      action: 'CHAT_REPORT',
      resource: 'chat_message',
      resourceId: message.id,
      userId: actor.id,
      subject: 'LDC Tools chat report',
      text: description,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile report message error:', error);
    return NextResponse.json({ error: 'Could not send the report. Try again in a moment.' }, { status: 500 });
  }
}
