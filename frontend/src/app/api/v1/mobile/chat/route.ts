import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { ensureTeamChannel } from '@/lib/chat';
import { userInGroupWhere } from '@/lib/work-item-access';

export async function GET(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const groupId = actor.constructionGroupId;

    await ensureTeamChannel(groupId);
    const [channels, teammates, reads] = await Promise.all([
      prisma.chatChannel.findMany({
        where: { constructionGroupId: groupId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { author: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        where: { ...userInGroupWhere(groupId), id: { not: actor.id } },
        select: { id: true, name: true, email: true },
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
      }),
      prisma.chatRead.findMany({
        where: { userId: actor.id },
        select: { channelId: true, readAt: true },
      }),
    ]);

    const readAt = new Map(reads.map((read) => [read.channelId, read.readAt]));
    const visible = channels.filter((channel) => (
      channel.kind === 'TEAM' || channel.directKey.split(':').includes(actor.id)
    ));
    const unreadCounts = await Promise.all(visible.map(async (channel) => {
      const since = readAt.get(channel.id);
      return prisma.chatMessage.count({
        where: {
          channelId: channel.id,
          authorId: { not: actor.id },
          ...(since ? { createdAt: { gt: since } } : {}),
        },
      });
    }));

    return NextResponse.json({
      teammates,
      channels: visible.map((channel, index) => {
        const otherId = channel.kind === 'DIRECT'
          ? channel.directKey.split(':').find((id) => id !== actor.id) || null
          : null;
        const other = teammates.find((person) => person.id === otherId) || null;
        const latest = channel.messages[0] || null;
        return {
          id: channel.id,
          kind: channel.kind,
          title: channel.kind === 'TEAM' ? 'Team' : (other?.name || other?.email || 'Direct message'),
          otherUserId: otherId,
          unread: unreadCounts[index] || 0,
          latest: latest ? {
            body: latest.body,
            createdAt: latest.createdAt.toISOString(),
            authorName: latest.author.name || latest.author.email,
          } : null,
        };
      }),
    });
  } catch (error) {
    console.error('Mobile list chat error:', error);
    return NextResponse.json({ error: 'Could not load chat. Try again in a moment.' }, { status: 500 });
  }
}
