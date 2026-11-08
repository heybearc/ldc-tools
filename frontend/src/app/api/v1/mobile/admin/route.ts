import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMobileAdmin, requireMobileActor } from '@/lib/mobile-actor';
import { notifyGroupPhones } from '@/lib/expo-push';
import { sendEmail, generateFeedbackStatusChangeEmail } from '@/lib/email';

const STATUSES = new Set(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    if (!isMobileAdmin(access.actor.role)) {
      return NextResponse.json({ error: 'Admin access is required' }, { status: 403 });
    }
    const groupId = access.actor.constructionGroupId;
    const [users, announcements, feedback, audit, userCount] = await Promise.all([
      prisma.user.findMany({
        where: { constructionGroupId: groupId },
        orderBy: { name: 'asc' },
        take: 200,
        select: { id: true, name: true, email: true, role: true, status: true },
      }),
      prisma.announcement.findMany({
        where: { constructionGroupId: groupId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, title: true, message: true, type: true, isActive: true },
      }),
      prisma.feedback.findMany({
        where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          feedbackNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          type: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { user: { constructionGroupId: groupId } },
        orderBy: { timestamp: 'desc' },
        take: 12,
        select: {
          id: true,
          action: true,
          resource: true,
          timestamp: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.user.count({ where: { constructionGroupId: groupId, status: 'ACTIVE' } }),
    ]);
    return NextResponse.json({
      activeUsers: userCount,
      users,
      announcements,
      feedback,
      audit: audit.map((row) => ({
        id: row.id,
        action: row.action,
        resource: row.resource,
        at: row.timestamp.toISOString(),
        who: row.user?.name || row.user?.email || 'Someone',
      })),
    });
  } catch (error) {
    console.error('Mobile admin error:', error);
    return NextResponse.json({ error: 'Could not load admin tools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    if (!isMobileAdmin(access.actor.role)) {
      return NextResponse.json({ error: 'Admin access is required' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    if (body.action === 'announcement') return createAnnouncement(access.actor, body);
    if (body.action === 'role') return changeRole(access.actor, body);
    if (body.action === 'feedback') return changeFeedback(access.actor, body);
    return NextResponse.json({ error: 'Choose an admin action' }, { status: 400 });
  } catch (error) {
    console.error('Mobile admin update error:', error);
    return NextResponse.json({ error: 'Could not save that change' }, { status: 500 });
  }
}

async function createAnnouncement(
  actor: { id: string; constructionGroupId: string },
  body: Record<string, unknown>,
) {
  const title = String(body.title || '').trim();
  const message = String(body.message || '').trim();
  const type = String(body.type || 'INFO').toUpperCase();
  if (!title || !message) return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  if (!['INFO', 'WARNING', 'URGENT'].includes(type)) {
    return NextResponse.json({ error: 'Choose an announcement type' }, { status: 400 });
  }
  const created = await prisma.announcement.create({
    data: {
      title,
      message,
      type: type as 'INFO',
      constructionGroupId: actor.constructionGroupId,
      createdBy: actor.id,
      isActive: true,
    },
    select: { id: true },
  });
  notifyGroupPhones({
    constructionGroupId: actor.constructionGroupId,
    excludeUserId: actor.id,
    title,
    body: message,
  }).catch((error) => console.error('Announcement push failed:', error));
  return NextResponse.json(created, { status: 201 });
}

async function changeRole(
  actor: { id: string; role: string; constructionGroupId: string },
  body: Record<string, unknown>,
) {
  const userId = String(body.userId || '');
  const role = String(body.role || '').toUpperCase();
  const allowed = actor.role === 'SUPER_ADMIN'
    ? ['SUPER_ADMIN', 'ADMIN', 'USER', 'READ_ONLY']
    : ['ADMIN', 'USER', 'READ_ONLY'];
  if (!allowed.includes(role)) return NextResponse.json({ error: 'Choose a role you can assign' }, { status: 400 });
  const user = await prisma.user.findFirst({
    where: { id: userId, constructionGroupId: actor.constructionGroupId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'That account is not in this construction group' }, { status: 404 });
  await prisma.user.update({ where: { id: user.id }, data: { role: role as 'USER' } });
  return NextResponse.json({ ok: true });
}

async function changeFeedback(
  actor: { name: string | null },
  body: Record<string, unknown>,
) {
  const id = String(body.feedbackId || '');
  const status = String(body.status || '').toUpperCase();
  const resolutionComment = String(body.resolutionComment || '').trim();
  if (!STATUSES.has(status)) return NextResponse.json({ error: 'Choose a status' }, { status: 400 });
  const current = await prisma.feedback.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!current) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  if (status === 'RESOLVED' && !resolutionComment && !current.resolutionComment?.trim()) {
    return NextResponse.json({ error: 'A resolution note is required' }, { status: 400 });
  }
  await prisma.feedback.update({
    where: { id },
    data: {
      status: status as 'NEW',
      resolutionComment: resolutionComment || current.resolutionComment,
    },
  });
  if (current.status !== status && current.user?.email) {
    try {
      const html = generateFeedbackStatusChangeEmail(
        current.title,
        current.status,
        status,
        current.id,
        current.user.name || 'User',
      );
      await sendEmail({
        to: current.user.email,
        subject: `Feedback ${current.feedbackNumber} is ${status.toLowerCase().replace('_', ' ')}`,
        html,
      });
    } catch (error) {
      console.error('Feedback status email failed:', error);
    }
  }
  return NextResponse.json({ ok: true, actor: actor.name });
}
