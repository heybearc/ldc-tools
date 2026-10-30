import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup, canPostWork } from '@/lib/work-item-access';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Personnel can assign work' }, { status: 403 });
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : [];
    const assigneeId = typeof body.assigneeId === 'string' ? body.assigneeId : '';
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Select at least one task' }, { status: 400 });
    }
    if (!assigneeId) {
      return NextResponse.json({ error: 'Choose a person' }, { status: 400 });
    }

    const assignee = await activeUserInGroup(assigneeId, scope.constructionGroupId);
    if (!assignee) {
      return NextResponse.json({ error: 'Assignee must be signed in to this construction group' }, { status: 400 });
    }

    const openItems = await prisma.workItem.findMany({
      where: {
        id: { in: ids },
        constructionGroupId: scope.constructionGroupId,
        status: 'OPEN',
      },
      select: { id: true },
    });
    if (openItems.length === 0) {
      return NextResponse.json({ error: 'Those tasks are not open in this construction group' }, { status: 400 });
    }

    await prisma.workItem.updateMany({
      where: { id: { in: openItems.map((item) => item.id) } },
      data: { assigneeId },
    });

    return NextResponse.json({ assigned: openItems.length });
  } catch (error) {
    console.error('Assign work items error:', error);
    return NextResponse.json({ error: 'Failed to assign work' }, { status: 500 });
  }
}
