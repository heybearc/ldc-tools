// API route for Trade Teams Overview with all oversight data
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
import { loadDirectoryGroups } from '@/lib/directory-groups';
import { visibleAssignments } from '@/lib/directory-assignments';

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
            },
            contact: true,
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
                },
                contact: true,
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
      contact: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        image: string | null;
        isSister: boolean;
      } | null;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        firstName: string | null;
        lastName: string | null;
        isSister: boolean;
        volunteer: { phone: string | null; firstName: string; lastName: string } | null;
      } | null;
    }) => {
      const contact = assignment.contact;
      const user = assignment.user;
      const person = contact
        ? {
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            email: contact.email,
            image: contact.image,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            isSister: contact.isSister,
          }
        : user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              firstName: user.volunteer?.firstName || user.firstName,
              lastName: user.volunteer?.lastName || user.lastName,
              phone: user.volunteer?.phone || null,
              isSister: user.isSister,
            }
          : null;
      if (!person) return null;
      return {
        id: assignment.id,
        role: assignment.role,
        isActive: assignment.isActive,
        awaitingReplacement: assignment.awaitingReplacement,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        user: person,
      };
    };

    const formattedTeams = tradeTeams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      oversight: visibleAssignments(team.oversight).map(presentPerson).filter((row) => row != null),
      crews: team.crews.map(crew => ({
        id: crew.id,
        name: crew.name,
        description: crew.description,
        scopeOfWork: crew.scopeOfWork,
        isRequired: crew.isRequired,
        status: crew.status,
        oversight: visibleAssignments(crew.oversight).map(presentPerson).filter((row) => row != null)
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
