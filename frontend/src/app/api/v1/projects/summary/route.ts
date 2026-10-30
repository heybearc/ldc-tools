import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { formatCalendarDate } from '@/lib/work-items';
import { canPostWork } from '@/lib/work-item-access';
import { canAssignProjectPersonnel, personnelInGroup } from '@/lib/project-personnel';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const [canAssign, canAddDate] = await Promise.all([
      canAssignProjectPersonnel(session.user.id, scope),
      canPostWork(session.user.id, scope),
    ]);
    const [projects, personnel, dates] = await Promise.all([
      prisma.project.findMany({
        where: { constructionGroupId: scope.constructionGroupId, isActive: true },
        select: {
          id: true,
          name: true,
          projectNumber: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          builderAssistantUrl: true,
          personnel: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      canAssign ? personnelInGroup(scope.constructionGroupId) : Promise.resolve([]),
      prisma.workItem.findMany({
        where: {
          constructionGroupId: scope.constructionGroupId,
          timingKind: 'PROJECT_DATE',
          projectId: { not: null },
        },
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
      canAssign,
      canAddDate,
      personnel,
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        number: project.projectNumber,
        location: project.location,
        status: project.status,
        start: project.startDate ? formatCalendarDate(project.startDate.toISOString()) : null,
        end: project.endDate ? formatCalendarDate(project.endDate.toISOString()) : null,
        builderAssistantUrl: project.builderAssistantUrl,
        personnel: project.personnel.map((row) => row.user),
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
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}
