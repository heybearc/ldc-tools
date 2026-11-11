import { prisma } from '@/lib/prisma';
import { formatPhoneForDisplay } from '@/lib/phone-utils';
import { withCGFilter, type CGScope } from '@/lib/cg-scope';

const PERSONNEL_BUCKET: Record<string, 'contact' | 'assistant' | 'support'> = {
  PC: 'contact',
  PCA: 'assistant',
  PC_SUPPORT: 'support',
  'PC-Support': 'support',
};

const CONSTRUCTION_GROUP_BUCKET: Record<string, 'contact' | 'assistant' | 'support'> = {
  CGO: 'contact',
  ACGO: 'assistant',
  CGOA: 'assistant',
  'CGO-Support': 'support',
  'CG-Support': 'support',
  CG_SUPPORT: 'support',
};

const ANCILLARY_CATEGORIES = new Set(['CG_STAFF', 'REGION_SUPPORT_SERVICES']);

export type DirectoryContact = {
  id: string;
  role: string;
  roleLabel: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    isSister: boolean;
  };
};

function contactFromUser(input: {
  id: string;
  role: string;
  roleLabel: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    isSister: boolean;
    volunteer: { phone: string | null; firstName: string; lastName: string; emailPersonal: string | null } | null;
  } | null;
  volunteer?: {
    id: string;
    firstName: string;
    lastName: string;
    emailPersonal: string | null;
    phone: string | null;
  } | null;
}): DirectoryContact {
  const volunteer = input.user?.volunteer || input.volunteer;
  const email = input.user?.email || volunteer?.emailPersonal || '';
  return {
    id: input.id,
    role: input.role,
    roleLabel: input.roleLabel,
    user: {
      id: input.user?.id || input.volunteer?.id || input.id,
      name: input.user?.name || (volunteer ? `${volunteer.firstName} ${volunteer.lastName}`.trim() : null),
      email,
      image: input.user?.image || null,
      firstName: volunteer?.firstName || input.user?.firstName || null,
      lastName: volunteer?.lastName || input.user?.lastName || null,
      phone: formatPhoneForDisplay(volunteer && 'phone' in volunteer ? volunteer.phone : null) || null,
      isSister: input.user?.isSister || false,
    },
  };
}

export async function loadDirectoryGroups(scope: CGScope) {
  const cgWhere = withCGFilter(scope);
  const [personnelContacts, volunteers] = await Promise.all([
    prisma.personnelContact.findMany({
      where: { ...cgWhere, isActive: true, endDate: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
            isSister: true,
            volunteer: { select: { phone: true, firstName: true, lastName: true, emailPersonal: true } },
          },
        },
      },
    }),
    prisma.volunteer.findMany({
      where: { ...cgWhere, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
            isSister: true,
            volunteer: { select: { phone: true, firstName: true, lastName: true, emailPersonal: true } },
          },
        },
        roles: {
          where: { isActive: true, endDate: null },
        },
      },
    }),
  ]);

  const personnel = { contact: [] as DirectoryContact[], assistant: [] as DirectoryContact[], support: [] as DirectoryContact[] };
  const constructionGroup = { contact: [] as DirectoryContact[], assistant: [] as DirectoryContact[], support: [] as DirectoryContact[] };
  const seenPersonnel = new Set<string>();
  const seenConstruction = new Set<string>();
  const addToColumns = (
    columns: typeof personnel,
    seen: Set<string>,
    buckets: Record<string, 'contact' | 'assistant' | 'support'>,
    row: DirectoryContact,
  ) => {
    const bucket = buckets[row.role];
    if (!bucket) return false;
    const key = `${row.user.id}:${bucket}`;
    if (seen.has(key)) return true;
    seen.add(key);
    columns[bucket].push(row);
    return true;
  };
  const addPersonnel = (row: DirectoryContact) => addToColumns(personnel, seenPersonnel, PERSONNEL_BUCKET, row);

  for (const row of personnelContacts) {
    addPersonnel(contactFromUser({
      id: row.id,
      role: row.role,
      roleLabel: row.role,
      user: row.user,
    }));
  }

  const ancillary = new Map<string, DirectoryContact[]>();
  const seenAncillary = new Set<string>();
  for (const volunteer of volunteers) {
    for (const role of volunteer.roles) {
      const person = contactFromUser({
        id: role.id,
        role: role.roleCode,
        roleLabel: role.roleName,
        user: volunteer.user,
        volunteer,
      });
      if (addPersonnel(person)) continue;
      if (role.roleCategory === 'CG_OVERSIGHT' || CONSTRUCTION_GROUP_BUCKET[role.roleCode]) {
        const bucket = CONSTRUCTION_GROUP_BUCKET[role.roleCode]
          || (role.roleName.toLowerCase().includes('support')
            ? 'support'
            : role.roleName.toLowerCase().includes('assistant')
              ? 'assistant'
              : 'contact');
        const key = `${person.user.id}:${bucket}`;
        if (!seenConstruction.has(key)) {
          seenConstruction.add(key);
          constructionGroup[bucket].push(person);
        }
        continue;
      }
      if (!ANCILLARY_CATEGORIES.has(role.roleCategory)) continue;
      const key = `${person.user.id}:${role.roleName}`;
      if (seenAncillary.has(key)) continue;
      seenAncillary.add(key);
      const list = ancillary.get(role.roleName) || [];
      list.push(person);
      ancillary.set(role.roleName, list);
    }
  }

  const byName = (a: DirectoryContact, b: DirectoryContact) =>
    (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email);
  personnel.contact.sort(byName);
  personnel.assistant.sort(byName);
  personnel.support.sort(byName);
  constructionGroup.contact.sort(byName);
  constructionGroup.assistant.sort(byName);
  constructionGroup.support.sort(byName);

  return {
    constructionGroup,
    personnel,
    ancillary: Array.from(ancillary.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([role, people]) => ({ role, people: people.sort(byName) })),
  };
}
