import { prisma } from '@/lib/prisma';
import type { CGScope } from '@/lib/cg-scope';
import { isPersonnelRole } from '@/lib/work-items';

function userInGroupWhere(constructionGroupId: string) {
  return {
    status: 'ACTIVE' as const,
    OR: [
      { volunteer: { isActive: true, constructionGroupId } },
      { volunteerId: null, constructionGroupId },
    ],
  };
}

export async function isPersonnelLead(userId: string, constructionGroupId: string): Promise<boolean> {
  const [contact, volunteerRole] = await Promise.all([
    prisma.personnelContact.findFirst({
      where: {
        userId,
        constructionGroupId,
        isActive: true,
        endDate: null,
        role: { in: ['PC', 'PCA'] },
      },
      select: { id: true },
    }),
    prisma.volunteerRole.findFirst({
      where: {
        isActive: true,
        endDate: null,
        roleCode: { in: ['PC', 'PCA'] },
        volunteer: {
          isActive: true,
          constructionGroupId,
          user: { id: userId },
        },
      },
      select: { id: true },
    }),
  ]);
  return Boolean(contact || volunteerRole);
}

export async function canPostWork(userId: string, scope: CGScope): Promise<boolean> {
  if (!scope.constructionGroupId) return false;
  if (scope.userRole === 'SUPER_ADMIN' || scope.userRole === 'ADMIN') return true;

  const constructionGroupId = scope.constructionGroupId;
  const [contact, volunteerRole] = await Promise.all([
    prisma.personnelContact.findFirst({
      where: {
        userId,
        constructionGroupId,
        isActive: true,
        endDate: null,
        role: { in: ['PC', 'PCA', 'PC_SUPPORT'] },
      },
      select: { id: true },
    }),
    prisma.volunteerRole.findFirst({
      where: {
        isActive: true,
        endDate: null,
        roleCode: { in: ['PC', 'PCA', 'PC-Support', 'PC_SUPPORT'] },
        volunteer: {
          isActive: true,
          constructionGroupId,
          user: { id: userId },
        },
      },
      select: { id: true, roleCode: true },
    }),
  ]);

  return Boolean(contact) || (volunteerRole ? isPersonnelRole(volunteerRole.roleCode) : false);
}

export async function activeUserInGroup(userId: string, constructionGroupId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...userInGroupWhere(constructionGroupId),
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export { userInGroupWhere };

export async function projectInGroup(projectId: string, constructionGroupId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, constructionGroupId, isActive: true },
    select: { id: true, name: true },
  });
}
