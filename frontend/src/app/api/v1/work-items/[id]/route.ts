import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup, canEditWorkItem, canPostWork, canRunWork, isPersonnelLead, projectInGroup } from '@/lib/work-item-access';
import { applyWorkStatus, startWork } from '@/lib/work-item-actions';
import { startedAtAfterAssigneeChange } from '@/lib/work-start';
import { dueOnDate, validateWorkItemInput } from '@/lib/work-items';
import { assigneeToNotify, enteredClaimPool } from '@/lib/work-available-notice';
import { queueWorkAssigned, queueWorkAvailable } from '@/lib/work-available-notify';

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
    const hasStart = body.start === true;
    const hasNotify = body.notifyRequestor !== undefined;
    const hasContent = ['title', 'detail', 'explanation', 'referenceUrl', 'timingKind', 'dueOn', 'projectId', 'claimable', 'assigneeId', 'requestorName', 'requestorEmail']
      .some((key) => body[key] !== undefined);
    if (!hasStatus && !hasNotify && !hasContent && !hasStart) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    if (hasContent && (hasStatus || hasNotify || hasStart)) {
      return NextResponse.json({ error: 'Save the work details on their own' }, { status: 400 });
    }
    if (hasStart && (hasStatus || hasNotify)) {
      return NextResponse.json({ error: 'Start the work on its own' }, { status: 400 });
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
        timingKind: true,
        createdById: true,
        notifyRequestor: true,
        requestorName: true,
        requestorEmail: true,
        claimable: true,
      },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    if (hasContent) {
      const lead = await isPersonnelLead(session.user.id, item.constructionGroupId);
      const personnel = await canPostWork(session.user.id, scope);
      const allowed = canEditWorkItem({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: scope.userRole,
        personnelLead: lead,
        createdById: item.createdById,
        requestorEmail: item.requestorEmail,
      }) || (item.timingKind === 'PROJECT_DATE' && personnel);
      if (!allowed) {
        return NextResponse.json({ error: 'Only an administrator or the person who submitted this work can edit it' }, { status: 403 });
      }
      if (item.timingKind === 'PROCESS' || item.timingKind === 'CREW_REQUEST') {
        body.timingKind = item.timingKind;
        body.dueOn = null;
      }
      const parsed = validateWorkItemInput(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const input = parsed.value;
      if (input.projectId) {
        const project = await projectInGroup(input.projectId, item.constructionGroupId);
        if (!project) {
          return NextResponse.json({ error: 'That project is not in this construction group' }, { status: 400 });
        }
      }
      if (input.assigneeId) {
        const assignee = await activeUserInGroup(input.assigneeId, item.constructionGroupId);
        if (!assignee) {
          return NextResponse.json({ error: 'Assignee must be signed in to this construction group' }, { status: 400 });
        }
      }
      const updated = await prisma.workItem.update({
        where: { id: item.id },
        data: {
          title: input.title,
          detail: input.detail,
          explanation: input.explanation,
          referenceUrl: input.referenceUrl,
          timingKind: input.timingKind,
          dueOn: dueOnDate(input.dueOn),
          projectId: input.projectId,
          claimable: input.claimable,
          assigneeId: input.assigneeId,
          startedAt: startedAtAfterAssigneeChange(item.assigneeId, input.assigneeId),
          requestorName: input.requestorName,
          requestorEmail: input.requestorEmail,
        },
        select: { id: true },
      });
      if (enteredClaimPool(
        { status: item.status, claimable: item.claimable, assigneeId: item.assigneeId },
        { status: item.status, claimable: input.claimable, assigneeId: input.assigneeId },
      )) {
        queueWorkAvailable({
          constructionGroupId: item.constructionGroupId,
          excludeUserId: session.user.id,
          items: [{ id: item.id, title: input.title, detail: input.detail }],
        });
      }
      const assigneeId = item.status === 'OPEN'
        ? assigneeToNotify(item.assigneeId, input.assigneeId, session.user.id)
        : null;
      if (assigneeId) {
        queueWorkAssigned({
          constructionGroupId: item.constructionGroupId,
          assigneeId,
          actorId: session.user.id,
          items: [{ id: item.id, title: input.title, detail: input.detail }],
        });
      }
      return NextResponse.json({ id: updated.id });
    }

    if (hasStart) {
      const result = await startWork({
        id: item.id,
        actorId: session.user.id,
        canRun: await canRunWork(session.user.id, scope),
        constructionGroupId: item.constructionGroupId,
      });
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.httpStatus });
      }
      return NextResponse.json(result);
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
      personnel: await canRunWork(session.user.id, scope),
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

export async function DELETE(
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
        timingKind: true,
        createdById: true,
        requestorEmail: true,
      },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }
    const [lead, personnel] = await Promise.all([
      isPersonnelLead(session.user.id, item.constructionGroupId),
      canPostWork(session.user.id, scope),
    ]);
    const allowed = canEditWorkItem({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: scope.userRole,
      personnelLead: lead,
      createdById: item.createdById,
      requestorEmail: item.requestorEmail,
    }) || (item.timingKind === 'PROJECT_DATE' && personnel);
    if (!allowed) {
      return NextResponse.json({ error: 'Only an administrator or the person who submitted this work can remove it' }, { status: 403 });
    }
    await prisma.workItem.delete({ where: { id: item.id } });
    return NextResponse.json({ id: item.id });
  } catch (error) {
    console.error('Delete work item error:', error);
    return NextResponse.json({ error: 'Failed to remove work' }, { status: 500 });
  }
}
