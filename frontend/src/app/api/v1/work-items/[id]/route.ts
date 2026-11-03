import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { applyWorkStatus } from '@/lib/work-item-actions';

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
    const hasStatus = body.status !== undefined;
    const hasNotify = body.notifyRequestor !== undefined;
    if (!hasStatus && !hasNotify) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    if (hasStatus && body.status !== 'DONE' && body.status !== 'OPEN') {
      return NextResponse.json({ error: 'Status must be open or done' }, { status: 400 });
    }
    if (hasNotify && typeof body.notifyRequestor !== 'boolean') {
      return NextResponse.json({ error: 'Email notification must be on or off' }, { status: 400 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        constructionGroupId: true,
        assigneeId: true,
        status: true,
        title: true,
        detail: true,
        notifyRequestor: true,
        requestorName: true,
        requestorEmail: true,
      },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const personnel = await canPostWork(session.user.id, scope);
    if (!hasStatus) {
      const isAssignee = item.assigneeId === session.user.id;
      if (!personnel && !isAssignee) {
        return NextResponse.json({ error: 'Only Personnel or the assignee can update this work' }, { status: 403 });
      }
      const updated = await prisma.workItem.update({
        where: { id: item.id },
        data: { notifyRequestor: body.notifyRequestor },
        select: { id: true, status: true, completedAt: true, requestorName: true, requestorEmail: true },
      });
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        completedAt: updated.completedAt?.toISOString() || null,
        requestorName: updated.requestorName,
        requestorEmail: updated.requestorEmail,
        emailSent: false,
      });
    }

    const updated = await applyWorkStatus({
      id: item.id,
      status: body.status,
      actorId: session.user.id,
      actorName: session.user.name || 'Personnel',
      personnel,
      constructionGroupId: item.constructionGroupId,
    });
    if ('error' in updated) {
      return NextResponse.json({ error: updated.error }, { status: updated.httpStatus });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update work item error:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}
