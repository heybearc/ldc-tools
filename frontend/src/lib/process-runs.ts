import { prisma } from '@/lib/prisma';

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
  steps: ProcessRunStep[];
  projectId: string | null;
  assigneeId: string | null;
  claimable: boolean;
}) {
  const count = input.steps.length;
  return prisma.workItem.create({
    data: {
      constructionGroupId: input.constructionGroupId,
      title: input.name,
      detail: count === 1 ? '1 step' : `${count} steps`,
      timingKind: 'PROCESS',
      projectId: input.projectId,
      claimable: input.claimable,
      assigneeId: input.assigneeId,
      claimedAt: input.assigneeId ? new Date() : null,
      status: 'OPEN',
      processTemplateId: input.templateId,
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
