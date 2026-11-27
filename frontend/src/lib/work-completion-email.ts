import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decryptPassword } from '@/lib/email-crypto';
import { mailGatewayConfigured, sendViaMailGateway } from '@/lib/mail-gateway';
import { isDeliverableEmail } from '@/lib/reachable-email';

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
  crewRequest?: boolean;
}): Promise<boolean> {
  if (!isDeliverableEmail(input.requestorEmail)) {
    return false;
  }

  const greeting = input.requestorName || 'Hello';
  const crewRequest = input.crewRequest === true;
  const subject = crewRequest ? `Crew request completed — ${input.title}` : `${input.title} is done`;
  const lead = crewRequest ? 'Your crew request is done.' : 'This work is done.';
  const text = [
    `Hello ${greeting},`,
    '',
    lead,
    '',
    input.title,
    input.detail,
    '',
    `Completed by ${input.completedByName}.`,
  ].join('\n');
  const html = `
      <p>Hello ${escapeHtml(greeting)},</p>
      <p>${escapeHtml(lead)}</p>
      <p><strong>${escapeHtml(input.title)}</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(input.detail)}</p>
      <p>Completed by ${escapeHtml(input.completedByName)}.</p>
    `;
  if (mailGatewayConfigured()) {
    await sendViaMailGateway({
      to: [input.requestorEmail],
      subject,
      text,
      html,
      tags: { app: 'ldc-tools', event: 'work-completed' },
    });
    return true;
  }
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
  });
  if (!emailConfig?.fromEmail || !emailConfig.smtpHost) {
    return false;
  }
  const password = decryptPassword(emailConfig.appPasswordEncrypted || '');
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username || '',
      pass: password,
    },
    ...(emailConfig.encryption === 'ssl' ? {} : { requireTLS: true }),
  });
  await transporter.sendMail({
    from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
    to: input.requestorEmail,
    subject,
    text,
    html,
  });
  return true;
}

export async function sendWorkHelpEmail(input: {
  to: string[];
  title: string;
  detail: string;
  message: string;
  askedByName: string;
}): Promise<number> {
  const recipients = input.to.filter((email) => isDeliverableEmail(email));
  if (recipients.length === 0) return 0;

  const subject = `Help requested — ${input.title}`;
  const text = [
    `${input.askedByName} asked for help on a work item.`,
    '',
    input.title,
    input.detail,
    '',
    input.message,
  ].join('\n');
  const html = `
      <p>${escapeHtml(input.askedByName)} asked for help on a work item.</p>
      <p><strong>${escapeHtml(input.title)}</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(input.detail)}</p>
      <p style="white-space: pre-wrap;">${escapeHtml(input.message)}</p>
    `;
  if (mailGatewayConfigured()) {
    return sendViaMailGateway({
      to: recipients,
      subject,
      text,
      html,
      tags: { app: 'ldc-tools', event: 'work-help' },
    });
  }
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
  });
  if (!emailConfig?.fromEmail || !emailConfig.smtpHost) {
    return 0;
  }

  const password = decryptPassword(emailConfig.appPasswordEncrypted || '');
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username || '',
      pass: password,
    },
    ...(emailConfig.encryption === 'ssl' ? {} : { requireTLS: true }),
  });

  await transporter.sendMail({
    from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
    to: recipients.join(', '),
    subject,
    text,
    html,
  });
  return recipients.length;
}

export async function sendWorkNoticeEmail(input: {
  to: string[];
  message: {
    subject: string;
    text: string;
    link: string;
    titles: string[];
    extra: number;
    detail: string;
    lead: string;
  } | null;
}): Promise<number> {
  const message = input.message;
  const recipients = input.to.filter((email) => isDeliverableEmail(email));
  if (!message || recipients.length === 0) return 0;

  const titles = message.titles.map((title) => `<li>${escapeHtml(title)}</li>`).join('');
  const more = message.extra > 0 ? `<li>and ${message.extra} more</li>` : '';
  const detail = message.detail ? `<p style="white-space: pre-wrap;">${escapeHtml(message.detail)}</p>` : '';
  const html = `
    <p>${escapeHtml(message.lead)}</p>
    <ul>${titles}${more}</ul>
    ${detail}
    <p><a href="${escapeHtml(message.link)}">Open this work in LDC Tools</a></p>
  `;
  if (mailGatewayConfigured()) {
    return sendViaMailGateway({
      to: recipients,
      subject: message.subject,
      text: message.text,
      html,
      tags: { app: 'ldc-tools', event: 'work-notice' },
    });
  }
  const emailConfig = await prisma.emailConfiguration.findFirst({
    where: { isActive: true },
  });
  if (!emailConfig?.fromEmail || !emailConfig.smtpHost) return 0;

  const password = decryptPassword(emailConfig.appPasswordEncrypted || '');
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.encryption === 'ssl',
    auth: {
      user: emailConfig.username || '',
      pass: password,
    },
    ...(emailConfig.encryption === 'ssl' ? {} : { requireTLS: true }),
  });

  for (const recipient of recipients) {
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: recipient,
      subject: message.subject,
      text: message.text,
      html,
    });
  }
  return recipients.length;
}
