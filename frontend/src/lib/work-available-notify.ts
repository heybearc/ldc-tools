import { prisma } from '@/lib/prisma';
import { hiddenReleaseCheckWork } from '@/lib/release-check-cleanup';
import { isDeliverableEmail } from '@/lib/reachable-email';
import { sendChatPush } from '@/lib/web-push';
import { sendWorkNoticeEmail } from '@/lib/work-completion-email';
import { userInGroupWhere } from '@/lib/work-item-access';
import { PERSONNEL_ROLE_CODES } from '@/lib/work-items';
import {
  assigneeToNotify,
  operatorTestEmail,
  workAssignedMessage,
  workAvailableMessage,
  type WorkNoticeItem,
} from '@/lib/work-available-notice';

async function groupUsers(constructionGroupId: string) {
  return prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        {
          volunteer: {
            isActive: true,
            constructionGroupId,
            roles: {
              some: {
                isActive: true,
                endDate: null,
                roleCode: { in: [...PERSONNEL_ROLE_CODES] },
              },
            },
          },
        },
        {
          personnelContacts: {
            some: { isActive: true, endDate: null, constructionGroupId },
          },
        },
      ],
    },
    select: { id: true, email: true },
  });
}

function recipientsFrom(users: Array<{ id: string; email: string }>, excludeUserId?: string) {
  const userIds: string[] = [];
  const emails = new Map<string, string>();
  for (const user of users) {
    if (excludeUserId && user.id === excludeUserId) continue;
    userIds.push(user.id);
    if (!isDeliverableEmail(user.email)) continue;
    const key = user.email.toLowerCase();
    if (!emails.has(key)) emails.set(key, user.email);
  }
  return { userIds, emails: Array.from(emails.values()) };
}

async function deliverWorkNotice(input: {
  constructionGroupId: string;
  userIds: string[];
  emails: string[];
  excludeUserId?: string;
  message: ReturnType<typeof workAvailableMessage>;
  kind: string;
}) {
  const message = input.message;
  if (!message) return;
  if (input.userIds.length > 0) {
    try {
      await sendChatPush({
        userIds: input.userIds,
        excludeUserId: input.excludeUserId || '',
        title: message.pushTitle,
        body: message.pushBody,
        url: message.pushUrl,
        constructionGroupId: input.constructionGroupId,
        kind: input.kind,
        data: message.workItemId ? { workItemId: message.workItemId } : undefined,
      });
    } catch (error) {
      console.error('Work alert failed:', error);
    }
  }
  try {
    await sendWorkNoticeEmail({ to: input.emails, message });
  } catch (error) {
    console.error('Work email failed:', error);
  }
}

export async function claimableWorkCount(constructionGroupId: string) {
  return prisma.workItem.count({
    where: {
      constructionGroupId,
      assigneeId: null,
      claimable: true,
      status: 'OPEN',
      ...hiddenReleaseCheckWork,
    },
  });
}

export async function availableWorkCountForUser(userId: string, constructionGroupId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...userInGroupWhere(constructionGroupId) },
    select: { id: true },
  });
  if (!user) return 0;
  return claimableWorkCount(constructionGroupId);
}

async function sendOperatorCopy(message: ReturnType<typeof workAvailableMessage>) {
  if (!message) return;
  try {
    await sendWorkNoticeEmail({ to: [operatorTestEmail()], message });
  } catch (error) {
    console.error('Work email failed:', error);
  }
}

export async function notifyWorkAvailable(input: {
  constructionGroupId: string;
  excludeUserId?: string;
  items: WorkNoticeItem[];
}) {
  const message = workAvailableMessage(input.items);
  if (message) {
    const recipients = recipientsFrom(await groupUsers(input.constructionGroupId), input.excludeUserId);
    await deliverWorkNotice({
      constructionGroupId: input.constructionGroupId,
      userIds: recipients.userIds,
      emails: recipients.emails,
      excludeUserId: input.excludeUserId,
      message,
      kind: 'work',
    });
  }
  await sendOperatorCopy(workAvailableMessage(input.items, undefined, 'operator'));
}

export function queueWorkAvailable(input: {
  constructionGroupId: string;
  excludeUserId?: string;
  items: WorkNoticeItem[];
}) {
  void notifyWorkAvailable(input).catch((error) => {
    console.error('Work available alert failed:', error);
  });
}

export async function notifyWorkAssigned(input: {
  constructionGroupId: string;
  assigneeId: string;
  actorId: string;
  items: WorkNoticeItem[];
}) {
  if (assigneeToNotify(null, input.assigneeId, input.actorId) !== input.assigneeId) return;
  const message = workAssignedMessage(input.items);
  if (message) {
    const users = await groupUsers(input.constructionGroupId);
    const assignee = users.find((user) => user.id === input.assigneeId);
    if (assignee) {
      const recipients = recipientsFrom([assignee]);
      await deliverWorkNotice({
        constructionGroupId: input.constructionGroupId,
        userIds: recipients.userIds,
        emails: recipients.emails,
        message,
        kind: 'work-assigned',
      });
    }
  }
  await sendOperatorCopy(workAssignedMessage(input.items, undefined, 'operator'));
}

export function queueWorkAssigned(input: {
  constructionGroupId: string;
  assigneeId: string;
  actorId: string;
  items: WorkNoticeItem[];
}) {
  void notifyWorkAssigned(input).catch((error) => {
    console.error('Work assigned alert failed:', error);
  });
}
