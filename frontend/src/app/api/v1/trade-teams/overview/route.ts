// API route for Trade Teams Overview with all oversight data
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
import { visibleAssignments } from '@/lib/directory-assignments';
import type { CGScope } from '@/lib/cg-scope';

const PERSONNEL_BUCKET: Record<string, 'contact' | 'assistant' | 'support'> = {
  PC: 'contact',
  PCA: 'assistant',
  PC_SUPPORT: 'support',
  'PC-Support': 'support',
};

const ANCILLARY_CATEGORIES = new Set(['CG_OVERSIGHT', 'CG_STAFF', 'REGION_SUPPORT_SERVICES']);

type DirectoryContact = {
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
      phone: volunteer && 'phone' in volunteer ? volunteer.phone : null,
      isSister: input.user?.isSister || false,
    },
  };
}

async function loadDirectoryGroups(scope: CGScope) {
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
  const seenPersonnel = new Set<string>();
  const addPersonnel = (row: DirectoryContact) => {
    const bucket = PERSONNEL_BUCKET[row.role];
    if (!bucket) return;
    const key = `${row.user.id}:${bucket}`;
    if (seenPersonnel.has(key)) return;
    seenPersonnel.add(key);
    personnel[bucket].push(row);
  };

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
      if (PERSONNEL_BUCKET[role.roleCode]) {
        addPersonnel(person);
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

  return {
    personnel,
    ancillary: Array.from(ancillary.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([role, people]) => ({ role, people: people.sort(byName) })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope) {
      return NextResponse.json({ error: 'Unable to determine CG scope' }, { status: 403 });
    }

    // Get all trade teams with crews and oversight assignments
    const tradeTeams = await prisma.tradeTeam.findMany({
      where: {
        ...withCGFilter(scope),
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        oversight: {
          where: {
            OR: [{ isActive: true }, { endDate: { not: null } }]
          },
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
                volunteer: { select: { phone: true, firstName: true, lastName: true } }
              }
            }
          }
        },
        crews: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          },
          include: {
            oversight: {
              where: {
                OR: [{ isActive: true }, { endDate: { not: null } }]
              },
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
                    volunteer: { select: { phone: true, firstName: true, lastName: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform data to match expected format
    const presentPerson = (assignment: {
      id: string;
      role: string;
      isActive: boolean;
      awaitingReplacement: boolean;
      startDate: Date;
      endDate: Date | null;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        firstName: string | null;
        lastName: string | null;
        isSister: boolean;
        volunteer: { phone: string | null; firstName: string; lastName: string } | null;
      };
    }) => ({
      id: assignment.id,
      role: assignment.role,
      isActive: assignment.isActive,
      awaitingReplacement: assignment.awaitingReplacement,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      user: {
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        image: assignment.user.image,
        firstName: assignment.user.volunteer?.firstName || assignment.user.firstName,
        lastName: assignment.user.volunteer?.lastName || assignment.user.lastName,
        phone: assignment.user.volunteer?.phone || null,
        isSister: assignment.user.isSister
      }
    });

    const formattedTeams = tradeTeams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      oversight: visibleAssignments(team.oversight).map(presentPerson),
      crews: team.crews.map(crew => ({
        id: crew.id,
        name: crew.name,
        description: crew.description,
        scopeOfWork: crew.scopeOfWork,
        isRequired: crew.isRequired,
        status: crew.status,
        oversight: visibleAssignments(crew.oversight).map(presentPerson)
      }))
    }));

    const directoryGroups = await loadDirectoryGroups(scope);

    return NextResponse.json({
      tradeTeams: formattedTeams,
      totalTeams: formattedTeams.length,
      totalCrews: formattedTeams.reduce((sum, t) => sum + t.crews.length, 0),
      directoryGroups,
    });

  } catch (error) {
    console.error('Trade Teams Overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
