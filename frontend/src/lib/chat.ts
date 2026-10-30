import { prisma } from '@/lib/prisma';
import { userInGroupWhere } from '@/lib/work-item-access';
import { sendChatPush } from '@/lib/web-push';

export function directKey(userA: string, userB: string) {
  return [userA, userB].sort().join(':');
}

export async function ensureTeamChannel(constructionGroupId: string) {
  return prisma.chatChannel.upsert({
    where: { constructionGroupId_directKey: { constructionGroupId, directKey: 'team' } },
    create: { constructionGroupId, kind: 'TEAM', directKey: 'team' },
    update: {},
  });
}

export async function groupUserIds(constructionGroupId: string) {
  const users = await prisma.user.findMany({
    where: userInGroupWhere(constructionGroupId),
    select: { id: true },
  });
  return users.map((user) => user.id);
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
  await sendChatPush({
    userIds,
    excludeUserId: input.authorId,
    title: input.kind === 'TEAM' ? 'Team chat' : input.authorName,
    body: `${input.authorName}: ${input.body}`,
    url: `/chat?channel=${input.channelId}`,
  });
}
