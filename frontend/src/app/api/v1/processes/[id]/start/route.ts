import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork, projectInGroup } from '@/lib/work-item-access';
import { createProcessRun } from '@/lib/process-runs';
import { placementForTemplate } from '@/lib/processes';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    if (!(await canPostWork(session.user.id, scope))) {
      return NextResponse.json({ error: 'Personnel can start a process' }, { status: 403 });
    }

    const template = await prisma.processTemplate.findFirst({
      where: { id: params.id, constructionGroupId: scope.constructionGroupId, isActive: true },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
    if (!template) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    if (template.steps.length === 0) {
      return NextResponse.json({ error: 'This process has no tasks' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedProjectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : null;
    const placement = placementForTemplate(template, requestedProjectId);
    if (!placement.ok) {
      return NextResponse.json({ error: placement.error }, { status: 400 });
    }
    if (placement.projectId) {
      const project = await projectInGroup(placement.projectId, scope.constructionGroupId);
      if (!project) {
        return NextResponse.json({ error: 'That project is not in this construction group' }, { status: 400 });
      }
    }

    const item = await createProcessRun({
      constructionGroupId: scope.constructionGroupId,
      createdById: session.user.id,
      templateId: template.id,
      name: template.name,
      purpose: template.purpose,
      cadence: placement.cadence,
      steps: template.steps,
      projectId: placement.projectId,
      assigneeId: null,
      claimable: true,
    });

    return NextResponse.json({
      item: {
        id: item.id,
        title: item.title,
        claimable: item.claimable,
        steps: item.steps.map((step) => ({
          id: step.id,
          title: step.title,
          detail: step.detail,
          explanation: step.explanation,
        })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Start process error:', error);
    return NextResponse.json({ error: 'Failed to start the process' }, { status: 500 });
  }
}
