import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadDirectoryGroups } from '@/lib/directory-groups';
import { directorySections, personFromAssignment } from '@/lib/mobile-directory';
import { readMobileToken } from '@/lib/mobile-session';
import { mobileGateResponse } from '@/lib/mobile-actor';
import { timingLabel } from '@/lib/work-items';
import { formatPhoneForDisplay } from '@/lib/phone-utils';
import { hiddenReleaseCheckWork } from '@/lib/release-check-cleanup';

const ROLE_LABEL: Record<string, string> = {
  TTO: 'Overseer',
  TTOA: 'Assistant',
  TT_SUPPORT: 'Support',
  TCO: 'Overseer',
  TCOA: 'Assistant',
  TC_SUPPORT: 'Support',
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  firstName: true,
  lastName: true,
  volunteer: { select: { phone: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const token = readMobileToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { id: true, name: true, email: true, constructionGroupId: true, status: true },
    });
    const denied = mobileGateResponse(user);
    if (denied || !user?.constructionGroupId) {
      return denied ?? NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const groupId = user.constructionGroupId;
    const workSelect = {
      id: true,
      title: true,
      detail: true,
      timingKind: true,
      processCadence: true,
      dueOn: true,
      project: { select: { name: true } },
      steps: {
        orderBy: { position: 'asc' as const },
        select: { id: true, done: true },
      },
    } as const;
    const [work, available, teams, groups] = await Promise.all([
      prisma.workItem.findMany({
        where: { constructionGroupId: groupId, assigneeId: user.id, status: 'OPEN', ...hiddenReleaseCheckWork },
        orderBy: [{ dueOn: 'asc' }, { createdAt: 'desc' }],
        take: 50,
        select: workSelect,
      }),
      prisma.workItem.findMany({
        where: { constructionGroupId: groupId, assigneeId: null, claimable: true, status: 'OPEN', ...hiddenReleaseCheckWork },
        orderBy: [{ dueOn: 'asc' }, { createdAt: 'desc' }],
        take: 50,
        select: workSelect,
      }),
      prisma.tradeTeam.findMany({
        where: { constructionGroupId: groupId, isActive: true },
        orderBy: { name: 'asc' },
        include: {
          oversight: {
            where: { isActive: true, endDate: null },
            include: {
              user: { select: USER_SELECT },
              contact: true,
            },
          },
          crews: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
              oversight: {
                where: { isActive: true, endDate: null },
                include: {
                  user: { select: USER_SELECT },
                  contact: true,
                },
              },
            },
          },
        },
      }),
      loadDirectoryGroups({
        userId: user.id,
        constructionGroupId: groupId,
        regionId: null,
        zoneId: null,
        branchId: null,
        userRole: '',
        canViewAllBranches: false,
        canViewAllZones: false,
        canViewZoneRegions: false,
        canManageCG: false,
      }),
    ]);

    const sections = directorySections(groups);
    const directoryTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      people: team.oversight.map((row) => personFromAssignment({
        id: row.id,
        role: row.role,
        user: row.user
          ? { ...row.user, phone: formatPhoneForDisplay(row.user.volunteer?.phone) || null }
          : null,
        contact: row.contact
          ? { ...row.contact, phone: formatPhoneForDisplay(row.contact.phone) || null }
          : null,
      }, team.name, ROLE_LABEL[row.role] || row.role, { teamId: team.id })),
      crews: team.crews.map((crew) => ({
        id: crew.id,
        name: crew.name,
        people: crew.oversight.map((row) => personFromAssignment({
          id: row.id,
          role: row.role,
          user: row.user
            ? { ...row.user, phone: formatPhoneForDisplay(row.user.volunteer?.phone) || null }
            : null,
          contact: row.contact
            ? { ...row.contact, phone: formatPhoneForDisplay(row.contact.phone) || null }
            : null,
        }, `${team.name} · ${crew.name}`, ROLE_LABEL[row.role] || row.role, { teamId: team.id, crewId: crew.id })),
      })),
    }));
    const people = [
      ...sections.people,
      ...directoryTeams.flatMap((team) => [
        ...team.people,
        ...team.crews.flatMap((crew) => crew.people),
      ]),
    ];
    const mapWork = (item: typeof work[number]) => {
      const dueOn = item.dueOn ? item.dueOn.toISOString().slice(0, 10) : null;
      return {
        id: item.id,
        title: item.title,
        detail: item.detail,
        timing: timingLabel(item.timingKind, dueOn, item.project?.name || null, item.processCadence),
        stepsDone: item.steps.filter((step) => step.done).length,
        stepsTotal: item.steps.length,
      };
    };

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      work: work.map(mapWork),
      available: available.map(mapWork),
      people,
      directory: {
        constructionGroup: sections.constructionGroup,
        personnel: sections.personnel,
        ancillary: sections.ancillary,
        teams: directoryTeams,
      },
    });
  } catch (error) {
    console.error('Mobile home error:', error);
    return NextResponse.json({ error: 'Could not load My Work and the directory. Try again in a moment.' }, { status: 500 });
  }
}
