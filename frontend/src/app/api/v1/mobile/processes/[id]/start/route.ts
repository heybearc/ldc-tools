import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { createProcessRun } from '@/lib/process-runs';
import { projectInGroup } from '@/lib/work-item-access';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can start a process' }, { status: 403 });
    }
    const template = await prisma.processTemplate.findFirst({
      where: { id: params.id, constructionGroupId: actor.constructionGroupId, isActive: true },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
    if (!template) return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    if (template.steps.length === 0) {
      return NextResponse.json({ error: 'This process has no steps' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const projectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : null;
    if (projectId && !(await projectInGroup(projectId, actor.constructionGroupId))) {
      return NextResponse.json({ error: 'That project is not in this construction group' }, { status: 400 });
    }
    const item = await createProcessRun({
      constructionGroupId: actor.constructionGroupId,
      createdById: actor.id,
      templateId: template.id,
      name: template.name,
      steps: template.steps,
      projectId,
      assigneeId: null,
      claimable: true,
    });
    return NextResponse.json({ id: item.id, title: item.title }, { status: 201 });
  } catch (error) {
    console.error('Mobile start process error:', error);
    return NextResponse.json({ error: 'Could not start the process' }, { status: 500 });
  }
}
