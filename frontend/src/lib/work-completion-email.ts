import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decryptPassword } from '@/lib/email-crypto';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendWorkCompletionEmail(input: {
  requestorName: string | null;
  requestorEmail: string;
  title: string;
  detail: string;
  completedByName: string;
}): Promise<boolean> {
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
  });
  if (!emailConfig?.fromEmail || !emailConfig.smtpHost) {
    return false;
  }

  const password = decryptPassword(emailConfig.appPasswordEncrypted || '');
  const transportConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
    tls?: { ciphers: string };
  } = {
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username || '',
      pass: password,
    },
  };
  if (emailConfig.encryption === 'tls') {
    transportConfig.tls = { ciphers: 'SSLv3' };
  }

  const greeting = input.requestorName || 'Hello';
  const transporter = nodemailer.createTransport(transportConfig);
  await transporter.sendMail({
    from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
    to: input.requestorEmail,
    subject: `Crew request completed — ${input.title}`,
    text: [
      `Hello ${greeting},`,
      '',
      'Your crew request is done.',
      '',
      input.title,
      input.detail,
      '',
      `Completed by ${input.completedByName}.`,
    ].join('\n'),
    html: `
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>Your crew request is done.</p>
      <p><strong>${escapeHtml(input.title)}</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(input.detail)}</p>
      <p>Completed by ${escapeHtml(input.completedByName)}.</p>
    `,
  });
  return true;
}
