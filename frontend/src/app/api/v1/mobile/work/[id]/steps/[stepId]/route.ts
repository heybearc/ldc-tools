import { NextRequest, NextResponse } from 'next/server';
import { requireMobileActor, scopeForActor } from '@/lib/mobile-actor';
import { canPostWork } from '@/lib/work-item-access';
import { setWorkStepDone } from '@/lib/work-item-actions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const body = await request.json().catch(() => ({}));
    if (typeof body.done !== 'boolean') {
      return NextResponse.json({ error: 'Choose whether the step is done' }, { status: 400 });
    }
    const result = await setWorkStepDone({
      workItemId: params.id,
      stepId: params.stepId,
      done: body.done,
      actorId: actor.id,
      personnel: await canPostWork(actor.id, scopeForActor(actor)),
      constructionGroupId: actor.constructionGroupId,
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mobile update step error:', error);
    return NextResponse.json({ error: 'Could not update the step. Try again in a moment.' }, { status: 500 });
  }
}
