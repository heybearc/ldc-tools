import { prisma } from '@/lib/prisma';
import { hiddenReleaseCheckWork } from '@/lib/release-check-cleanup';
import { isDeliverableEmail } from '@/lib/reachable-email';
import { sendChatPush } from '@/lib/web-push';
import { sendWorkAvailableEmail } from '@/lib/work-completion-email';
import { userInGroupWhere } from '@/lib/work-item-access';
import { workAvailableAlert, type WorkNoticeItem } from '@/lib/work-available-notice';

const CLAIM_ROLES = ['PC', 'PCA'] as const;

export async function personnelClaimNotifyUserIds(constructionGroupId: string) {
  const [contacts, roles] = await Promise.all([
    prisma.personnelContact.findMany({
      where: {
        constructionGroupId,
        isActive: true,
        endDate: null,
        role: { in: [...CLAIM_ROLES] },
        user: { status: 'ACTIVE' },
      },
      select: { userId: true },
    }),
    prisma.volunteerRole.findMany({
      where: {
        isActive: true,
        endDate: null,
        roleCode: { in: [...CLAIM_ROLES] },
        volunteer: {
          isActive: true,
          constructionGroupId,
          user: { status: 'ACTIVE' },
        },
      },
      select: { volunteer: { select: { user: { select: { id: true } } } } },
    }),
  ]);
  const ids = new Set<string>();
  for (const contact of contacts) ids.add(contact.userId);
  for (const role of roles) {
    const id = role.volunteer.user?.id;
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

export async function teamClaimNotifyEmails(constructionGroupId: string, excludeUserId?: string) {
  const users = await prisma.user.findMany({
    where: userInGroupWhere(constructionGroupId),
    select: { id: true, email: true },
  });
  const emails = new Map<string, string>();
  for (const user of users) {
    if (excludeUserId && user.id === excludeUserId) continue;
    if (!isDeliverableEmail(user.email)) continue;
    const key = user.email.toLowerCase();
    if (!emails.has(key)) emails.set(key, user.email);
  }
  return Array.from(emails.values());
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
  const recipients = await personnelClaimNotifyUserIds(constructionGroupId);
  if (!recipients.includes(userId)) return 0;
  return claimableWorkCount(constructionGroupId);
}

export async function notifyWorkAvailable(input: {
  constructionGroupId: string;
  excludeUserId?: string;
  items: WorkNoticeItem[];
}) {
  const alert = workAvailableAlert(input.items);
  if (!alert) return;
  const userIds = await personnelClaimNotifyUserIds(input.constructionGroupId);
  if (userIds.length > 0) {
    try {
      await sendChatPush({
        userIds,
        excludeUserId: input.excludeUserId || '',
        title: alert.title,
        body: alert.body,
        url: alert.url,
        constructionGroupId: input.constructionGroupId,
        kind: 'work',
        data: alert.workItemId ? { workItemId: alert.workItemId } : undefined,
      });
    } catch (error) {
      console.error('Work available alert failed:', error);
    }
  }
  try {
    const emails = await teamClaimNotifyEmails(input.constructionGroupId, input.excludeUserId);
    await sendWorkAvailableEmail({ to: emails, items: input.items });
  } catch (error) {
    console.error('Work available email failed:', error);
  }
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
