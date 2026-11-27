import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup, canPostWork } from '@/lib/work-item-access';
import { queueWorkAssigned } from '@/lib/work-available-notify';
import { assigneeToNotify } from '@/lib/work-available-notice';

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
      select: { id: true, title: true, detail: true, assigneeId: true },
    });
    if (openItems.length === 0) {
      return NextResponse.json({ error: 'Those tasks are not open in this construction group' }, { status: 400 });
    }

    const changing = openItems.filter((item) => item.assigneeId !== assigneeId);
    await prisma.workItem.updateMany({
      where: {
        id: { in: openItems.map((item) => item.id) },
        OR: [
          { assigneeId: null },
          { assigneeId: { not: assigneeId } },
        ],
      },
      data: { assigneeId, startedAt: null },
    });

    const notifyId = assigneeToNotify(null, assigneeId, session.user.id);
    if (notifyId && changing.length > 0) {
      queueWorkAssigned({
        constructionGroupId: scope.constructionGroupId,
        assigneeId: notifyId,
        actorId: session.user.id,
        items: changing.map((item) => ({ id: item.id, title: item.title, detail: item.detail })),
      });
    }

    return NextResponse.json({ assigned: openItems.length });
  } catch (error) {
    console.error('Assign work items error:', error);
    return NextResponse.json({ error: 'Failed to assign work' }, { status: 500 });
  }
}
