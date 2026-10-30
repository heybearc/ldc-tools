import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { userInGroupWhere } from '@/lib/work-item-access';
import { ensureTeamChannel } from '@/lib/chat';
import { getPushConfig } from '@/lib/web-push';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const groupId = scope.constructionGroupId;
    await ensureTeamChannel(groupId);
    const [channels, teammates, reads, push] = await Promise.all([
      prisma.chatChannel.findMany({
        where: { constructionGroupId: groupId },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { author: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        where: { ...userInGroupWhere(groupId), id: { not: session.user.id } },
        select: { id: true, name: true, email: true },
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
      }),
      prisma.chatRead.findMany({
        where: { userId: session.user.id },
        select: { channelId: true, readAt: true },
      }),
      getPushConfig(),
    ]);

    const readAt = new Map(reads.map((read) => [read.channelId, read.readAt]));
    const visible = channels.filter((channel) => (
      channel.kind === 'TEAM' || channel.directKey.split(':').includes(session.user.id)
    ));
    const unreadCounts = await Promise.all(visible.map(async (channel) => {
      const since = readAt.get(channel.id);
      return prisma.chatMessage.count({
        where: {
          channelId: channel.id,
          authorId: { not: session.user.id },
          ...(since ? { createdAt: { gt: since } } : {}),
        },
      });
    }));

    return NextResponse.json({
      currentUserId: session.user.id,
      vapidPublicKey: push.publicKey,
      teammates,
      channels: visible.map((channel, index) => {
        const otherId = channel.kind === 'DIRECT'
          ? channel.directKey.split(':').find((id) => id !== session.user.id) || null
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
    console.error('List chat error:', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}
