import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { sendWorkCompletionEmail } from '@/lib/work-completion-email';
import { canEmailAddress } from '@/lib/reachable-email';

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
    const isAssignee = item.assigneeId === session.user.id;
    if (!personnel && !isAssignee) {
      return NextResponse.json({ error: 'Only Personnel or the assignee can update this work' }, { status: 403 });
    }

    const updated = await prisma.workItem.update({
      where: { id: item.id },
      data: {
        ...(hasStatus ? {
          status: body.status,
          completedAt: body.status === 'DONE' ? new Date() : null,
        } : {}),
        ...(hasNotify ? { notifyRequestor: body.notifyRequestor } : {}),
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
        requestorName: true,
        requestorEmail: true,
      },
    });

    let emailSent = false;
    if (hasStatus && body.status === 'DONE' && item.status !== 'DONE' && item.requestorEmail && canEmailAddress(item.requestorEmail, item.notifyRequestor)) {
      try {
        emailSent = await sendWorkCompletionEmail({
          requestorName: item.requestorName,
          requestorEmail: item.requestorEmail,
          title: item.title,
          detail: item.detail,
          completedByName: session.user.name || 'Personnel',
        });
      } catch (emailError) {
        console.error('Work completion email failed:', emailError);
      }
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString() || null,
      requestorName: updated.requestorName,
      requestorEmail: updated.requestorEmail,
      emailSent,
    });
  } catch (error) {
    console.error('Update work item error:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}
