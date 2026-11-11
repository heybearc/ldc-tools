import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { blockedUserIds, chatPeople, ensureTeamChannel } from '@/lib/chat';

export async function GET(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const groupId = actor.constructionGroupId;

    await ensureTeamChannel(groupId);
    const blocked = new Set(await blockedUserIds(actor.id));
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
      chatPeople(groupId),
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
      teammates: teammates.filter((person) => person.id !== actor.id && !blocked.has(person.id)),
      channels: visible.map((channel, index) => {
        const otherId = channel.kind === 'DIRECT'
          ? channel.directKey.split(':').find((id) => id !== actor.id) || null
          : null;
        const other = teammates.find((person) => person.id === otherId) || null;
        const latest = channel.messages[0] || null;
        const latestVisible = latest && !blocked.has(latest.authorId) ? latest : null;
        return {
          id: channel.id,
          kind: channel.kind,
          title: channel.kind === 'TEAM' ? 'Team chat' : (other?.name || other?.email || 'Direct message'),
          otherUserId: otherId,
          unread: unreadCounts[index] || 0,
          latest: latestVisible ? {
            body: latestVisible.body,
            createdAt: latestVisible.createdAt.toISOString(),
            authorName: latestVisible.author.name || latestVisible.author.email,
          } : null,
        };
      }).sort((a, b) => (a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'TEAM' ? -1 : 1)),
    });
  } catch (error) {
    console.error('Mobile list chat error:', error);
    return NextResponse.json({ error: 'Could not load chat. Try again in a moment.' }, { status: 500 });
  }
}
