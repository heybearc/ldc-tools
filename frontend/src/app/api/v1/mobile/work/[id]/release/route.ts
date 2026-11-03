import { NextRequest, NextResponse } from 'next/server';
import { requireMobileActor, scopeForActor } from '@/lib/mobile-actor';
import { canPostWork } from '@/lib/work-item-access';
import { releaseWorkToPool } from '@/lib/work-item-actions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;
    const result = await releaseWorkToPool({
      id: params.id,
      actorId: actor.id,
      personnel: await canPostWork(actor.id, scopeForActor(actor)),
      constructionGroupId: actor.constructionGroupId,
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mobile release work error:', error);
    return NextResponse.json({ error: 'Could not return the work to the pool. Try again in a moment.' }, { status: 500 });
  }
}
