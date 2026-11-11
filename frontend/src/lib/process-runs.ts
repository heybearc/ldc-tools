import { prisma } from '@/lib/prisma';
import { cadenceLabel, type ProcessCadence, type ProcessCustomUnit } from '@/lib/processes';

export async function setProcessPublished(input: {
  id: string;
  constructionGroupId: string;
  publish: boolean;
}) {
  const template = await prisma.processTemplate.findFirst({
    where: { id: input.id, constructionGroupId: input.constructionGroupId, isActive: true },
    include: { steps: { select: { id: true }, take: 1 } },
  });
  if (!template) return { ok: false as const, status: 404, error: 'Process not found' };
  if (input.publish && template.steps.length === 0) {
    return { ok: false as const, status: 400, error: 'Add at least one task before publishing' };
  }
  const updated = await prisma.processTemplate.update({
    where: { id: template.id },
    data: {
      status: input.publish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: input.publish ? new Date() : null,
    },
    include: { steps: { orderBy: { position: 'asc' } } },
  });
  return { ok: true as const, template: updated };
}

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
  customEvery: number | null;
  customUnit: ProcessCustomUnit | null;
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
      processSchedule: cadenceLabel(input.cadence, input.customEvery, input.customUnit),
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
