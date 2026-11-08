import { prisma } from '@/lib/prisma';

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  badge?: number;
  channelId: 'default';
  data?: Record<string, string>;
};

export async function saveExpoPushToken(userId: string, token: string) {
  const value = token.trim();
  if (!value.startsWith('ExponentPushToken[') && !value.startsWith('ExpoPushToken[')) {
    throw new Error('That is not a phone notification token');
  }
  await prisma.expoPushToken.upsert({
    where: { token: value },
    create: { userId, token: value },
    update: { userId },
  });
}

export async function removeExpoPushToken(userId: string, token?: string) {
  await prisma.expoPushToken.deleteMany({
    where: { userId, ...(token ? { token } : {}) },
  });
}

export async function chatBadgeCount(userId: string, constructionGroupId: string) {
  const [channels, reads] = await Promise.all([
    prisma.chatChannel.findMany({
      where: { constructionGroupId },
      select: { id: true, kind: true, directKey: true },
    }),
    prisma.chatRead.findMany({
      where: { userId },
      select: { channelId: true, readAt: true },
    }),
  ]);
  const readAt = new Map(reads.map((read) => [read.channelId, read.readAt]));
  const counts = await Promise.all(channels.map(async (channel) => {
    if (channel.kind === 'DIRECT' && !channel.directKey.split(':').includes(userId)) return 0;
    const since = readAt.get(channel.id);
    return prisma.chatMessage.count({
      where: {
        channelId: channel.id,
        authorId: { not: userId },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }));
  return counts.reduce((sum, count) => sum + count, 0);
}

export async function sendExpoPush(input: {
  userIds: string[];
  excludeUserId?: string;
  title: string;
  body: string;
  constructionGroupId?: string;
  data?: Record<string, string>;
}) {
  const targets = [...new Set(input.userIds.filter((id) => id && id !== input.excludeUserId))];
  if (targets.length === 0) return;
  const tokens = await prisma.expoPushToken.findMany({
    where: { userId: { in: targets } },
    select: { token: true, userId: true },
  });
  if (tokens.length === 0) return;

  const badges = new Map<string, number>();
  if (input.constructionGroupId) {
    await Promise.all(targets.map(async (userId) => {
      badges.set(userId, await chatBadgeCount(userId, input.constructionGroupId!));
    }));
  }

  const messages: ExpoMessage[] = tokens.map((row) => ({
    to: row.token,
    title: input.title,
    body: input.body.slice(0, 140),
    sound: 'default',
    channelId: 'default',
    ...(badges.has(row.userId) ? { badge: badges.get(row.userId) } : {}),
    ...(input.data ? { data: input.data } : {}),
  }));

  for (let index = 0; index < messages.length; index += 100) {
    const chunk = messages.slice(index, index + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    const payload = await response.json().catch(() => ({})) as { data?: Array<{ status?: string; details?: { error?: string } }> };
    const tickets = Array.isArray(payload.data) ? payload.data : [];
    const stale = tickets.flatMap((ticket, ticketIndex) => (
      ticket.details?.error === 'DeviceNotRegistered' ? [chunk[ticketIndex]?.to] : []
    )).filter(Boolean) as string[];
    if (stale.length > 0) {
      await prisma.expoPushToken.deleteMany({ where: { token: { in: stale } } });
    }
  }
}

export async function notifyGroupPhones(input: {
  constructionGroupId: string;
  excludeUserId?: string;
  title: string;
  body: string;
}) {
  const users = await prisma.user.findMany({
    where: { constructionGroupId: input.constructionGroupId, status: 'ACTIVE' },
    select: { id: true },
  });
  await sendExpoPush({
    userIds: users.map((user) => user.id),
    excludeUserId: input.excludeUserId,
    title: input.title,
    body: input.body,
    constructionGroupId: input.constructionGroupId,
    data: { kind: 'announcement' },
  });
}
