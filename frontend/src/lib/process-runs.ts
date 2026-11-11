import { prisma } from '@/lib/prisma';
import type { ProcessCadence } from '@/lib/processes';

export interface ProcessRunStep {
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
}

export async function createProcessRun(input: {
  constructionGroupId: string;
  createdById: string;
  templateId: string;
  name: string;
  purpose: string | null;
  cadence: ProcessCadence;
  steps: ProcessRunStep[];
  projectId: string | null;
  assigneeId: string | null;
  claimable: boolean;
}) {
  const count = input.steps.length;
  const taskLine = count === 1 ? '1 task' : `${count} tasks`;
  return prisma.workItem.create({
    data: {
      constructionGroupId: input.constructionGroupId,
      title: input.name,
      detail: input.purpose || taskLine,
      timingKind: 'PROCESS',
      projectId: input.projectId,
      claimable: input.claimable,
      assigneeId: input.assigneeId,
      claimedAt: input.assigneeId ? new Date() : null,
      status: 'OPEN',
      processTemplateId: input.templateId,
      processCadence: input.cadence,
      createdById: input.createdById,
      steps: {
        create: input.steps.map((step, index) => ({
          position: index,
          title: step.title,
          detail: step.detail,
          explanation: step.explanation,
          referenceUrl: step.referenceUrl,
        })),
      },
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      steps: { orderBy: { position: 'asc' } },
    },
  });
}
