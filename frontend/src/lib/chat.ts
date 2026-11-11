import { prisma } from '@/lib/prisma';
import { personnelInGroup } from '@/lib/project-personnel';
import { sendChatPush } from '@/lib/web-push';

const CHAT_STATUS = ['ACTIVE', 'INVITED'] as const;

export type ChatPerson = { id: string; name: string | null; email: string };

export function directKey(userA: string, userB: string) {
  return [userA, userB].sort().join(':');
}

export async function channelForMember(channelId: string, userId: string, constructionGroupId: string) {
  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
  if (!channel || channel.constructionGroupId !== constructionGroupId) return null;
  if (channel.kind === 'DIRECT' && !channel.directKey.split(':').includes(userId)) return null;
  return channel;
}

export async function ensureTeamChannel(constructionGroupId: string) {
  return prisma.chatChannel.upsert({
    where: { constructionGroupId_directKey: { constructionGroupId, directKey: 'team' } },
    create: { constructionGroupId, kind: 'TEAM', directKey: 'team' },
    update: {},
  });
}

export async function chatPeople(constructionGroupId: string): Promise<ChatPerson[]> {
  const [accounts, personnel] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: { in: [...CHAT_STATUS] },
        OR: [
          { volunteer: { isActive: true, constructionGroupId } },
          { constructionGroupId },
        ],
      },
      select: { id: true, name: true, email: true },
    }),
    personnelInGroup(constructionGroupId),
  ]);

  const people = new Map<string, ChatPerson>();
  for (const person of [...accounts, ...personnel]) {
    people.set(person.id, { id: person.id, name: person.name, email: person.email });
  }
  return Array.from(people.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
}

export async function personCanChat(userId: string, constructionGroupId: string) {
  const people = await chatPeople(constructionGroupId);
  return people.some((person) => person.id === userId);
}

export async function groupUserIds(constructionGroupId: string) {
  const people = await chatPeople(constructionGroupId);
  return people.map((person) => person.id);
}

export async function setChannelRead(channelId: string, userId: string, unread: boolean) {
  if (!unread) {
    await prisma.chatRead.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: { readAt: new Date() },
    });
    return 0;
  }

  const latest = await prisma.chatMessage.findFirst({
    where: { channelId, authorId: { not: userId } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (!latest) return 0;

  const readAt = new Date(latest.createdAt.getTime() - 1);
  await prisma.chatRead.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId, readAt },
    update: { readAt },
  });
  return prisma.chatMessage.count({
    where: {
      channelId,
      authorId: { not: userId },
      createdAt: { gt: readAt },
    },
  });
}

export async function blockedUserIds(userId: string) {
  const rows = await prisma.chatBlock.findMany({
    where: { userId },
    select: { blockedUserId: true },
  });
  return rows.map((row) => row.blockedUserId);
}

export async function notifyChannel(input: {
  channelId: string;
  constructionGroupId: string;
  kind: 'TEAM' | 'DIRECT';
  directKey: string;
  authorId: string;
  authorName: string;
  body: string;
}) {
  let userIds: string[] = [];
  if (input.kind === 'TEAM') {
    userIds = await groupUserIds(input.constructionGroupId);
  } else {
    userIds = input.directKey.split(':').filter(Boolean);
  }
  if (userIds.length > 0) {
    const blocks = await prisma.chatBlock.findMany({
      where: { blockedUserId: input.authorId, userId: { in: userIds } },
      select: { userId: true },
    });
    const blocked = new Set(blocks.map((row) => row.userId));
    userIds = userIds.filter((id) => !blocked.has(id));
  }
  await sendChatPush({
    userIds,
    excludeUserId: input.authorId,
    title: input.kind === 'TEAM' ? 'Team chat' : input.authorName,
    body: `${input.authorName}: ${input.body}`,
    url: `/chat?channel=${input.channelId}`,
    constructionGroupId: input.constructionGroupId,
  });
}
