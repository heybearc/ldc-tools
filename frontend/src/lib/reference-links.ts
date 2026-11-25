import { prisma } from '@/lib/prisma';
import type { ReferenceInput } from '@/lib/references';

const linkSelect = {
  id: true,
  title: true,
  url: true,
  note: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listReferenceLinks(constructionGroupId: string) {
  return prisma.referenceLink.findMany({
    where: { constructionGroupId },
    select: linkSelect,
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
}

export async function createReferenceLink(input: {
  constructionGroupId: string;
  createdById: string;
  value: ReferenceInput;
}) {
  return prisma.referenceLink.create({
    data: {
      constructionGroupId: input.constructionGroupId,
      createdById: input.createdById,
      title: input.value.title,
      url: input.value.url,
      note: input.value.note,
      category: input.value.category,
    },
    select: linkSelect,
  });
}

export async function updateReferenceLink(id: string, constructionGroupId: string, value: ReferenceInput) {
  const existing = await prisma.referenceLink.findFirst({
    where: { id, constructionGroupId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.referenceLink.update({
    where: { id },
    data: {
      title: value.title,
      url: value.url,
      note: value.note,
      category: value.category,
    },
    select: linkSelect,
  });
}

export async function deleteReferenceLink(id: string, constructionGroupId: string) {
  const existing = await prisma.referenceLink.findFirst({
    where: { id, constructionGroupId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.referenceLink.delete({ where: { id } });
  return true;
}
