import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { loadGroupWork, setWorkStepDone } from '@/lib/work-item-actions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.done !== 'boolean') {
      return NextResponse.json({ error: 'Choose whether the step is done' }, { status: 400 });
    }

    const item = await loadGroupWork(params.id, scope.constructionGroupId);
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const result = await setWorkStepDone({
      workItemId: item.id,
      stepId: params.stepId,
      done: body.done,
      actorId: session.user.id,
      personnel: await canPostWork(session.user.id, scope),
      constructionGroupId: item.constructionGroupId,
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update work step error:', error);
    return NextResponse.json({ error: 'Could not update the step' }, { status: 500 });
  }
}
