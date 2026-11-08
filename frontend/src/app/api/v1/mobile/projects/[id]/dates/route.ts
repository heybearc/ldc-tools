import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { dueOnDate, validateWorkItemInput } from '@/lib/work-items';
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
      return NextResponse.json({ error: 'Personnel can add a date' }, { status: 403 });
    }
    if (!(await projectInGroup(params.id, actor.constructionGroupId))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = validateWorkItemInput({
      title: body.title,
      detail: body.detail || '',
      timingKind: 'PROJECT_DATE',
      dueOn: body.date || body.dueOn || null,
      projectId: params.id,
      claimable: false,
    });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const created = await prisma.workItem.create({
      data: {
        constructionGroupId: actor.constructionGroupId,
        title: parsed.value.title,
        detail: parsed.value.detail,
        timingKind: 'PROJECT_DATE',
        dueOn: dueOnDate(parsed.value.dueOn),
        projectId: params.id,
        claimable: false,
        status: 'OPEN',
        createdById: actor.id,
      },
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Mobile project date error:', error);
    return NextResponse.json({ error: 'Could not add the date' }, { status: 500 });
  }
}
