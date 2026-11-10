import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { removeReleaseCheckData } from '@/lib/release-check-cleanup';

export async function DELETE() {
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
      return NextResponse.json({ error: 'Personnel can remove release checks' }, { status: 403 });
    }

    const removed = await removeReleaseCheckData(scope.constructionGroupId);
    return NextResponse.json(removed);
  } catch (error) {
    console.error('Remove release checks error:', error);
    return NextResponse.json({ error: 'Could not remove release checks' }, { status: 500 });
  }
}
