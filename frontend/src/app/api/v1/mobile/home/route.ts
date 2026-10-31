import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readMobileToken } from '@/lib/mobile-session';
import { timingLabel } from '@/lib/work-items';

const ROLE_LABEL: Record<string, string> = {
  TTO: 'Overseer',
  TTOA: 'Assistant',
  TT_SUPPORT: 'Support',
  TCO: 'Overseer',
  TCOA: 'Assistant',
  TC_SUPPORT: 'Support',
};

function personName(input: {
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
} | null) {
  if (!input) return '';
  const named = `${input.firstName || ''} ${input.lastName || ''}`.trim();
  return input.name || named || input.email || '';
}

export async function GET(request: NextRequest) {
  try {
    const token = readMobileToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { id: true, name: true, email: true, constructionGroupId: true, status: true },
    });
    if (!user || user.status === 'INACTIVE' || !user.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const groupId = user.constructionGroupId;
    const [work, teams] = await Promise.all([
      prisma.workItem.findMany({
        where: { constructionGroupId: groupId, assigneeId: user.id, status: 'OPEN' },
        orderBy: [{ dueOn: 'asc' }, { createdAt: 'desc' }],
        take: 50,
        select: {
          id: true,
          title: true,
          detail: true,
          timingKind: true,
          dueOn: true,
          project: { select: { name: true } },
        },
      }),
      prisma.tradeTeam.findMany({
        where: { constructionGroupId: groupId, isActive: true },
        orderBy: { name: 'asc' },
        include: {
          oversight: {
            where: { isActive: true, endDate: null },
            include: {
              user: { select: { name: true, email: true, firstName: true, lastName: true } },
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
                  user: { select: { name: true, email: true, firstName: true, lastName: true } },
                  contact: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const people: Array<{ name: string; email: string; phone: string | null; role: string; place: string }> = [];
    const pushPerson = (
      row: {
        role: string;
        user: { name: string | null; email: string; firstName: string | null; lastName: string | null } | null;
        contact: { firstName: string; lastName: string; email: string; phone: string | null } | null;
      },
      place: string,
    ) => {
      const contact = row.contact;
      const account = row.user;
      people.push({
        name: contact ? `${contact.firstName} ${contact.lastName}`.trim() : personName(account),
        email: contact?.email || account?.email || '',
        phone: contact?.phone || null,
        role: ROLE_LABEL[row.role] || row.role,
        place,
      });
    };
    for (const team of teams) {
      for (const row of team.oversight) pushPerson(row, team.name);
      for (const crew of team.crews) {
        for (const row of crew.oversight) pushPerson(row, `${team.name} · ${crew.name}`);
      }
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      work: work.map((item) => {
        const dueOn = item.dueOn ? item.dueOn.toISOString().slice(0, 10) : null;
        return {
          id: item.id,
          title: item.title,
          detail: item.detail,
          timing: timingLabel(item.timingKind, dueOn, item.project?.name || null),
        };
      }),
      people,
    });
  } catch (error) {
    console.error('Mobile home error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
