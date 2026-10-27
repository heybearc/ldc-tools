import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';
import { parseDirectoryDate } from '@/lib/directory-assignments';
import {
  TRADE_CREW_OVERSIGHT_CONFIG,
  TRADE_TEAM_OVERSIGHT_CONFIG,
  validateRoleLimit,
} from '@/lib/oversight-types';

const TEAM_ROLES = new Set(['TTO', 'TTOA', 'TT_SUPPORT']);
const CREW_ROLES = new Set(['TCO', 'TCOA', 'TC_SUPPORT']);

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function syncPersonActive(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { volunteerId: true },
  });
  if (!user?.volunteerId) return;
  const [teamCount, crewCount] = await Promise.all([
    prisma.tradeTeamOversight.count({ where: { userId, isActive: true } }),
    prisma.tradeCrewOversight.count({ where: { userId, isActive: true } }),
  ]);
  await prisma.volunteer.update({
    where: { id: user.volunteerId },
    data: { isActive: teamCount + crewCount > 0 },
  });
}

async function ensureVolunteer(
  userId: string,
  constructionGroupId: string | null,
  fields: { firstName: string; lastName: string; email: string; phone: string | null }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { volunteer: true },
  });
  if (!user) return;
  if (user.volunteer) {
    await prisma.volunteer.update({
      where: { id: user.volunteer.id },
      data: {
        firstName: fields.firstName || user.volunteer.firstName,
        lastName: fields.lastName || user.volunteer.lastName,
        emailPersonal: fields.email || user.volunteer.emailPersonal,
        phone: fields.phone,
      },
    });
    return;
  }
  if (!constructionGroupId) return;
  const volunteer = await prisma.volunteer.create({
    data: {
      firstName: fields.firstName || 'Unknown',
      lastName: fields.lastName || 'Person',
      emailPersonal: fields.email,
      phone: fields.phone,
      constructionGroupId,
      isActive: true,
    },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { volunteerId: volunteer.id },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const role = String(body.role || '');
    const tradeTeamId = String(body.tradeTeamId || '');
    const crewId = body.crewId ? String(body.crewId) : null;
    const startDate = parseDirectoryDate(body.startDate) || new Date();

    if (!firstName || !lastName || !email || !tradeTeamId) {
      return NextResponse.json({ error: 'Name, email, and trade team are required' }, { status: 400 });
    }
    if (crewId ? !CREW_ROLES.has(role) : !TEAM_ROLES.has(role)) {
      return NextResponse.json({ error: 'Choose a role that matches the team or crew' }, { status: 400 });
    }

    const team = await prisma.tradeTeam.findUnique({ where: { id: tradeTeamId } });
    if (!team || !team.isActive) {
      return NextResponse.json({ error: 'Trade team not found' }, { status: 404 });
    }
    if (crewId) {
      const crew = await prisma.crew.findFirst({ where: { id: crewId, tradeTeamId, isActive: true } });
      if (!crew) return NextResponse.json({ error: 'Crew not found on that trade' }, { status: 404 });
    }

    const displayName = `${firstName} ${lastName}`.trim();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          firstName,
          lastName,
          role: 'READ_ONLY',
          status: 'INVITED',
          constructionGroupId: team.constructionGroupId,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || displayName,
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
          constructionGroupId: user.constructionGroupId || team.constructionGroupId,
        },
      });
    }
    await ensureVolunteer(user.id, team.constructionGroupId, { firstName, lastName, email, phone });

    if (crewId) {
      const currentCount = await prisma.tradeCrewOversight.count({
        where: { crewId, role: role as 'TCO', isActive: true },
      });
      const validation = validateRoleLimit(TRADE_CREW_OVERSIGHT_CONFIG, role, currentCount);
      if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
      const existing = await prisma.tradeCrewOversight.findUnique({
        where: { crewId_userId_role: { crewId, userId: user.id, role: role as 'TCO' } },
      });
      if (existing?.isActive) {
        return NextResponse.json({ error: 'This person already has that role on this crew' }, { status: 409 });
      }
      const saved = existing
        ? await prisma.tradeCrewOversight.update({
            where: { id: existing.id },
            data: { isActive: true, startDate, endDate: null },
          })
        : await prisma.tradeCrewOversight.create({
            data: { crewId, userId: user.id, role: role as 'TCO', isActive: true, startDate },
          });
      await syncPersonActive(user.id);
      return NextResponse.json(saved, { status: 201 });
    }

    const currentCount = await prisma.tradeTeamOversight.count({
      where: { tradeTeamId, role: role as 'TTO', isActive: true },
    });
    const validation = validateRoleLimit(TRADE_TEAM_OVERSIGHT_CONFIG, role, currentCount);
    if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
    const existing = await prisma.tradeTeamOversight.findUnique({
      where: { tradeTeamId_userId_role: { tradeTeamId, userId: user.id, role: role as 'TTO' } },
    });
    if (existing?.isActive) {
      return NextResponse.json({ error: 'This person already has that role on this trade' }, { status: 409 });
    }
    const saved = existing
      ? await prisma.tradeTeamOversight.update({
          where: { id: existing.id },
          data: { isActive: true, startDate, endDate: null },
        })
      : await prisma.tradeTeamOversight.create({
          data: { tradeTeamId, userId: user.id, role: role as 'TTO', isActive: true, startDate },
        });
    await syncPersonActive(user.id);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Directory POST error:', error);
    return NextResponse.json({ error: 'Failed to add person' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await requireUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const id = String(body.id || '');
    const scope = body.scope === 'crew' ? 'crew' : 'team';
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const role = String(body.role || '');
    const startDate = parseDirectoryDate(body.startDate);
    const endDate = body.endDate === '' || body.endDate == null ? null : parseDirectoryDate(body.endDate);
    const isActive = endDate == null;

    if (!id || !firstName || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (scope === 'crew' ? !CREW_ROLES.has(role) : !TEAM_ROLES.has(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (scope === 'crew') {
      const current = await prisma.tradeCrewOversight.findUnique({
        where: { id },
        include: { user: true, crew: true },
      });
      if (!current) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      if (role !== current.role) {
        const currentCount = await prisma.tradeCrewOversight.count({
          where: { crewId: current.crewId, role: role as 'TCO', isActive: true, NOT: { id } },
        });
        const validation = validateRoleLimit(TRADE_CREW_OVERSIGHT_CONFIG, role, currentCount);
        if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
      }
      const emailOwner = await prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== current.userId) {
        return NextResponse.json({ error: 'That email belongs to someone else' }, { status: 409 });
      }
      await prisma.user.update({
        where: { id: current.userId },
        data: { email, firstName, lastName, name: `${firstName} ${lastName}`.trim() },
      });
      await ensureVolunteer(current.userId, current.crew.constructionGroupId, {
        firstName,
        lastName,
        email,
        phone,
      });
      const saved = await prisma.tradeCrewOversight.update({
        where: { id },
        data: {
          role: role as 'TCO',
          isActive,
          startDate: startDate || current.startDate,
          endDate,
        },
      });
      await syncPersonActive(current.userId);
      return NextResponse.json(saved);
    }

    const current = await prisma.tradeTeamOversight.findUnique({
      where: { id },
      include: { user: true, tradeTeam: true },
    });
    if (!current) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (role !== current.role) {
      const currentCount = await prisma.tradeTeamOversight.count({
        where: { tradeTeamId: current.tradeTeamId, role: role as 'TTO', isActive: true, NOT: { id } },
      });
      const validation = validateRoleLimit(TRADE_TEAM_OVERSIGHT_CONFIG, role, currentCount);
      if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== current.userId) {
      return NextResponse.json({ error: 'That email belongs to someone else' }, { status: 409 });
    }
    await prisma.user.update({
      where: { id: current.userId },
      data: { email, firstName, lastName, name: `${firstName} ${lastName}`.trim() },
    });
    await ensureVolunteer(current.userId, current.tradeTeam.constructionGroupId, {
      firstName,
      lastName,
      email,
      phone,
    });
    const saved = await prisma.tradeTeamOversight.update({
      where: { id },
      data: {
        role: role as 'TTO',
        isActive,
        startDate: startDate || current.startDate,
        endDate,
      },
    });
    await syncPersonActive(current.userId);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Directory PATCH error:', error);
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'P2002') {
      return NextResponse.json({ error: 'That person already has this role here' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
