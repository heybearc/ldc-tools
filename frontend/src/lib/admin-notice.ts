import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function notifyAdmins(input: {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  subject: string;
  text: string;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      userId: input.userId,
      metadata: { subject: input.subject, text: input.text },
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, status: 'ACTIVE' },
    select: { email: true },
  });
  const to = Array.from(new Set(admins.map((admin) => admin.email).filter(Boolean)));
  if (to.length === 0) return false;
  return sendEmail({
    to,
    subject: input.subject,
    html: `<p>${escapeHtml(input.text).replace(/\n/g, '<br>')}</p>`,
  });
}
