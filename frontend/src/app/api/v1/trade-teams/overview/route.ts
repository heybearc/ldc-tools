// API route for Trade Teams Overview with all oversight data
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
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

    return NextResponse.json({
      tradeTeams: formattedTeams,
      totalTeams: formattedTeams.length,
      totalCrews: formattedTeams.reduce((sum, t) => sum + t.crews.length, 0)
    });

  } catch (error) {
    console.error('Trade Teams Overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
