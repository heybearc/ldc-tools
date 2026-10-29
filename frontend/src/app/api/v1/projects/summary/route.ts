import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { formatCalendarDate } from '@/lib/work-items';
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

    const canAssign = await canAssignProjectPersonnel(session.user.id, scope);
    const [projects, personnel] = await Promise.all([
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
    ]);

    return NextResponse.json({
      canAssign,
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
      })),
    });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}
