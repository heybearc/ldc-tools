import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readMobileToken } from '@/lib/mobile-session';
import { formatCalendarDate } from '@/lib/work-items';

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export async function GET(request: NextRequest) {
  try {
    const token = readMobileToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { id: true, status: true, constructionGroupId: true },
    });
    if (!user || user.status === 'INACTIVE' || !user.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const groupId = user.constructionGroupId;
    const [projects, dates] = await Promise.all([
      prisma.project.findMany({
        where: { constructionGroupId: groupId, isActive: true },
        select: {
          id: true,
          name: true,
          projectNumber: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          personnel: {
            select: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.workItem.findMany({
        where: { constructionGroupId: groupId, timingKind: 'PROJECT_DATE', projectId: { not: null } },
        select: { id: true, title: true, detail: true, dueOn: true, status: true, projectId: true },
        orderBy: [{ status: 'asc' }, { dueOn: 'asc' }],
      }),
    ]);

    const scheduleByProject = new Map<string, typeof dates>();
    for (const item of dates) {
      if (!item.projectId) continue;
      const rows = scheduleByProject.get(item.projectId) || [];
      rows.push(item);
      scheduleByProject.set(item.projectId, rows);
    }

    return NextResponse.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        number: project.projectNumber,
        location: project.location,
        status: STATUS_LABELS[project.status] || project.status,
        start: project.startDate ? formatCalendarDate(project.startDate.toISOString()) : null,
        end: project.endDate ? formatCalendarDate(project.endDate.toISOString()) : null,
        personnel: project.personnel.map((row) => ({
          id: row.user.id,
          name: row.user.name || row.user.email,
        })),
        schedule: (scheduleByProject.get(project.id) || []).map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.detail,
          date: item.dueOn ? formatCalendarDate(item.dueOn.toISOString()) : null,
          status: item.status,
        })),
      })),
    });
  } catch (error) {
    console.error('Mobile projects error:', error);
    return NextResponse.json({ error: 'Could not load projects. Try again in a moment.' }, { status: 500 });
  }
}
