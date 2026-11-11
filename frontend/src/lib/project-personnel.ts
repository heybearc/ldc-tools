import { prisma } from '@/lib/prisma';
import type { CGScope } from '@/lib/cg-scope';
import { PERSONNEL_ROLE_CODES } from '@/lib/work-items';

const OVERSIGHT_ROLE_CODES = ['CGO', 'CGOA', 'ACGO', 'CG-Support', 'CG_SUPPORT'];
const ASSIGNABLE_USER_STATUS = ['ACTIVE', 'INVITED'] as const;

export async function canAssignProjectPersonnel(userId: string, scope: CGScope): Promise<boolean> {
  if (!scope.constructionGroupId) return false;
  if (scope.userRole === 'SUPER_ADMIN' || scope.userRole === 'ADMIN') return true;

  const role = await prisma.volunteerRole.findFirst({
    where: {
      isActive: true,
      endDate: null,
      OR: [
        { roleCode: { in: OVERSIGHT_ROLE_CODES } },
        { roleCategory: 'CG_OVERSIGHT' },
      ],
      volunteer: {
        isActive: true,
        constructionGroupId: scope.constructionGroupId,
        user: { id: userId },
      },
    },
    select: { id: true },
  });
  return Boolean(role);
}

export async function personnelInGroup(constructionGroupId: string) {
  const assignableUser = { status: { in: [...ASSIGNABLE_USER_STATUS] } };
  const [contacts, volunteers] = await Promise.all([
    prisma.personnelContact.findMany({
      where: { constructionGroupId, isActive: true, endDate: null, user: assignableUser },
      select: { user: { select: { id: true, name: true, email: true, status: true } } },
    }),
    prisma.volunteer.findMany({
      where: {
        constructionGroupId,
        isActive: true,
        user: assignableUser,
        roles: {
          some: {
            isActive: true,
            endDate: null,
            roleCode: { in: [...PERSONNEL_ROLE_CODES] },
          },
        },
      },
      select: { user: { select: { id: true, name: true, email: true, status: true } } },
    }),
  ]);

  const people = new Map<string, { id: string; name: string | null; email: string }>();
  for (const row of [...contacts, ...volunteers]) {
    if (!row.user) continue;
    people.set(row.user.id, { id: row.user.id, name: row.user.name, email: row.user.email });
  }
  return Array.from(people.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
}
