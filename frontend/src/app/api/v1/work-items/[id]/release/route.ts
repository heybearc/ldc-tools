import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { loadGroupWork, releaseWorkToPool } from '@/lib/work-item-actions';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const item = await loadGroupWork(params.id, scope.constructionGroupId);
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const result = await releaseWorkToPool({
      id: item.id,
      actorId: session.user.id,
      personnel: await canPostWork(session.user.id, scope),
      constructionGroupId: item.constructionGroupId,
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Release work error:', error);
    return NextResponse.json({ error: 'Could not return the work to the pool' }, { status: 500 });
  }
}
