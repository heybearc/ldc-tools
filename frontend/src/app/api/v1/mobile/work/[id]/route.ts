import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor, scopeForActor } from '@/lib/mobile-actor';
import { canPostWork } from '@/lib/work-item-access';
import { applyWorkStatus } from '@/lib/work-item-actions';
import { timingLabel } from '@/lib/work-items';

const stepSelect = {
  id: true,
  title: true,
  detail: true,
  explanation: true,
  referenceUrl: true,
  done: true,
  position: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;

    const item = await prisma.workItem.findFirst({
      where: { id: params.id, constructionGroupId: actor.constructionGroupId },
      select: {
        id: true,
        title: true,
        detail: true,
        explanation: true,
        referenceUrl: true,
        timingKind: true,
        processCadence: true,
        processSchedule: true,
        dueOn: true,
        status: true,
        claimable: true,
        assigneeId: true,
        project: { select: { name: true } },
        steps: { orderBy: { position: 'asc' }, select: stepSelect },
      },
    });
    if (!item) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });

    const dueOn = item.dueOn ? item.dueOn.toISOString().slice(0, 10) : null;
    return NextResponse.json({
      id: item.id,
      title: item.title,
      detail: item.detail,
      explanation: item.explanation,
      referenceUrl: item.referenceUrl,
      timing: timingLabel(item.timingKind, dueOn, item.project?.name || null, item.processCadence, item.processSchedule),
      status: item.status,
      claimable: item.claimable,
      mine: item.assigneeId === actor.id,
      steps: item.steps.map((step) => ({
        id: step.id,
        title: step.title,
        detail: step.detail,
        explanation: step.explanation,
        referenceUrl: step.referenceUrl,
        done: step.done,
      })),
    });
  } catch (error) {
    console.error('Mobile work detail error:', error);
    return NextResponse.json({ error: 'Could not open the work. Try again in a moment.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const body = await request.json().catch(() => ({}));
    if (body.status !== 'DONE' && body.status !== 'OPEN') {
      return NextResponse.json({ error: 'Status must be open or done' }, { status: 400 });
    }

    const result = await applyWorkStatus({
      id: params.id,
      status: body.status,
      actorId: actor.id,
      actorName: actor.name || actor.email,
      personnel: await canPostWork(actor.id, scopeForActor(actor)),
      constructionGroupId: actor.constructionGroupId,
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mobile update work error:', error);
    return NextResponse.json({ error: 'Could not update the work. Try again in a moment.' }, { status: 500 });
  }
}
