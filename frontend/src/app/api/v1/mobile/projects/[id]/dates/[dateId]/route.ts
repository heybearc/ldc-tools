import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { dueOnDate, validateWorkItemInput } from '@/lib/work-items';

async function loadDate(projectId: string, dateId: string, constructionGroupId: string) {
  return prisma.workItem.findFirst({
    where: {
      id: dateId,
      projectId,
      constructionGroupId,
      timingKind: 'PROJECT_DATE',
    },
    select: { id: true },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; dateId: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can edit a date' }, { status: 403 });
    }
    const existing = await loadDate(params.id, params.dateId, actor.constructionGroupId);
    if (!existing) return NextResponse.json({ error: 'Date not found' }, { status: 404 });
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
    await prisma.workItem.update({
      where: { id: existing.id },
      data: {
        title: parsed.value.title,
        detail: parsed.value.detail,
        dueOn: dueOnDate(parsed.value.dueOn),
      },
    });
    return NextResponse.json({ id: existing.id });
  } catch (error) {
    console.error('Mobile project date update error:', error);
    return NextResponse.json({ error: 'Could not save the date' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dateId: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can remove a date' }, { status: 403 });
    }
    const existing = await loadDate(params.id, params.dateId, actor.constructionGroupId);
    if (!existing) return NextResponse.json({ error: 'Date not found' }, { status: 404 });
    await prisma.workItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ id: existing.id });
  } catch (error) {
    console.error('Mobile project date delete error:', error);
    return NextResponse.json({ error: 'Could not remove the date' }, { status: 500 });
  }
}
