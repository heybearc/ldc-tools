import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let configuredKey: string | null = null;

export async function getPushConfig() {
  const existing = await prisma.chatPushConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  const keys = webpush.generateVAPIDKeys();
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
    select: { fromEmail: true },
  });
  const subject = emailConfig?.fromEmail ? `mailto:${emailConfig.fromEmail}` : 'mailto:noreply@ldctools.local';
  return prisma.chatPushConfig.create({
    data: { id: 1, publicKey: keys.publicKey, privateKey: keys.privateKey, subject },
  });
}

async function ensureConfigured() {
  const config = await getPushConfig();
  if (configuredKey === config.publicKey) return config;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  configuredKey = config.publicKey;
  return config;
}

export async function sendChatPush(input: {
  userIds: string[];
  excludeUserId: string;
  title: string;
  body: string;
  url: string;
}) {
  const targets = input.userIds.filter((id) => id && id !== input.excludeUserId);
  if (targets.length === 0) return;
  await ensureConfigured();
  const subscriptions = await prisma.chatPushSubscription.findMany({
    where: { userId: { in: targets } },
  });
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: input.title,
          body: input.body.slice(0, 140),
          url: input.url,
        }),
      );
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.chatPushSubscription.deleteMany({ where: { endpoint: subscription.endpoint } });
      }
    }
  }));
}
