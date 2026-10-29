import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json();
    if (body.status !== 'DONE' && body.status !== 'OPEN') {
      return NextResponse.json({ error: 'Status must be open or done' }, { status: 400 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: { id: true, constructionGroupId: true, assigneeId: true },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const personnel = await canPostWork(session.user.id, scope);
    const isAssignee = item.assigneeId === session.user.id;
    if (!personnel && !isAssignee) {
      return NextResponse.json({ error: 'Only Personnel or the assignee can update this work' }, { status: 403 });
    }

    const updated = await prisma.workItem.update({
      where: { id: item.id },
      data: {
        status: body.status,
        completedAt: body.status === 'DONE' ? new Date() : null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update work item error:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}
