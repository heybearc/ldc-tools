import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup } from '@/lib/work-item-access';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        constructionGroupId: true,
        claimable: true,
        assigneeId: true,
        status: true,
      },
    });

    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    if (!item.claimable) {
      return NextResponse.json({ error: 'This work is not claimable' }, { status: 400 });
    }
    if (item.status !== 'OPEN') {
      return NextResponse.json({ error: 'This work is already finished' }, { status: 400 });
    }
    if (item.assigneeId && item.assigneeId !== session.user.id) {
      return NextResponse.json({ error: 'This work is already assigned' }, { status: 400 });
    }

    const member = await activeUserInGroup(session.user.id, item.constructionGroupId);
    const sameGroup = scope.constructionGroupId === item.constructionGroupId;
    if (!member && !(scope.userRole === 'SUPER_ADMIN' && sameGroup)) {
      return NextResponse.json({ error: 'Sign in to this construction group to claim work' }, { status: 403 });
    }

    const updated = await prisma.workItem.update({
      where: { id: item.id },
      data: {
        assigneeId: session.user.id,
        claimedAt: item.assigneeId === session.user.id ? undefined : new Date(),
      },
      select: { id: true, assigneeId: true },
    });

    return NextResponse.json({ id: updated.id, assigneeId: updated.assigneeId });
  } catch (error) {
    console.error('Claim work item error:', error);
    return NextResponse.json({ error: 'Failed to claim work' }, { status: 500 });
  }
}
