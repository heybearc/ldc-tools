import { prisma } from '@/lib/prisma';
import { canEmailAddress } from '@/lib/reachable-email';
import { sendWorkCompletionEmail } from '@/lib/work-completion-email';

const workSelect = {
  id: true,
  constructionGroupId: true,
  assigneeId: true,
  status: true,
  title: true,
  detail: true,
  notifyRequestor: true,
  requestorName: true,
  requestorEmail: true,
  claimable: true,
} as const;

export async function loadGroupWork(id: string, constructionGroupId: string) {
  const item = await prisma.workItem.findUnique({ where: { id }, select: workSelect });
  if (!item || item.constructionGroupId !== constructionGroupId) return null;
  return item;
}

export async function applyWorkStatus(input: {
  id: string;
  status: 'OPEN' | 'DONE';
  actorId: string;
  actorName: string;
  personnel: boolean;
  constructionGroupId: string;
}) {
  const item = await loadGroupWork(input.id, input.constructionGroupId);
  if (!item) return { error: 'Work item not found', httpStatus: 404 as const };
  if (input.status !== 'OPEN' && input.status !== 'DONE') {
    return { error: 'Status must be open or done', httpStatus: 400 as const };
  }
  const isAssignee = item.assigneeId === input.actorId;
  if (!input.personnel && !isAssignee) {
    return { error: 'Only Personnel or the assignee can update this work', httpStatus: 403 as const };
  }

  const updated = await prisma.workItem.update({
    where: { id: item.id },
    data: {
      status: input.status,
      completedAt: input.status === 'DONE' ? new Date() : null,
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
  if (input.status === 'DONE' && item.status !== 'DONE' && item.requestorEmail && canEmailAddress(item.requestorEmail, item.notifyRequestor)) {
    try {
      emailSent = await sendWorkCompletionEmail({
        requestorName: item.requestorName,
        requestorEmail: item.requestorEmail,
        title: item.title,
        detail: item.detail,
        completedByName: input.actorName || 'Personnel',
      });
    } catch (emailError) {
      console.error('Work completion email failed:', emailError);
    }
  }

  return {
    id: updated.id,
    status: updated.status,
    completedAt: updated.completedAt?.toISOString() || null,
    requestorName: updated.requestorName,
    requestorEmail: updated.requestorEmail,
    emailSent,
  };
}

export async function releaseWorkToPool(input: {
  id: string;
  actorId: string;
  personnel: boolean;
  constructionGroupId: string;
}) {
  const item = await loadGroupWork(input.id, input.constructionGroupId);
  if (!item) return { error: 'Work item not found', httpStatus: 404 as const };
  if (item.status !== 'OPEN') return { error: 'This work is already finished', httpStatus: 400 as const };
  if (!item.assigneeId) return { error: 'This work is already in the pool', httpStatus: 400 as const };
  if (item.assigneeId !== input.actorId && !input.personnel) {
    return { error: 'Only the assignee can return this work to the pool', httpStatus: 403 as const };
  }

  const updated = await prisma.workItem.update({
    where: { id: item.id },
    data: { assigneeId: null, claimedAt: null, claimable: true },
    select: { id: true, assigneeId: true, claimable: true },
  });
  return updated;
}

export async function setWorkStepDone(input: {
  workItemId: string;
  stepId: string;
  done: boolean;
  actorId: string;
  personnel: boolean;
  constructionGroupId: string;
}) {
  const step = await prisma.workItemStep.findFirst({
    where: { id: input.stepId, workItemId: input.workItemId },
    select: {
      id: true,
      workItem: {
        select: { constructionGroupId: true, assigneeId: true, status: true },
      },
    },
  });
  if (!step || step.workItem.constructionGroupId !== input.constructionGroupId) {
    return { error: 'Step not found', httpStatus: 404 as const };
  }
  if (step.workItem.status !== 'OPEN') {
    return { error: 'This work is already finished', httpStatus: 400 as const };
  }
  const isAssignee = step.workItem.assigneeId === input.actorId;
  if (!input.personnel && !isAssignee) {
    return { error: 'Only Personnel or the assignee can check a step', httpStatus: 403 as const };
  }

  const updated = await prisma.workItemStep.update({
    where: { id: step.id },
    data: { done: input.done },
    select: { id: true, done: true },
  });
  return updated;
}
