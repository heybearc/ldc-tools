import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
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

function supportRole(crewId: string | null) {
  return crewId ? 'TC_SUPPORT' : 'TT_SUPPORT';
}

function sisterRoleError(isSister: boolean, role: string, crewId: string | null) {
  if (isSister && role !== supportRole(crewId)) return 'Sisters can only be Support';
  return null;
}

async function moveAssignment(
  tx: Prisma.TransactionClient,
  input: {
    originScope: 'crew' | 'team';
    originId: string;
    userId: string;
    tradeTeamId: string;
    crewId: string | null;
    role: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
  }
) {
  const dates = {
    isActive: input.isActive,
    startDate: input.startDate,
    endDate: input.endDate,
  };
  if (input.crewId) {
    const existing = await tx.tradeCrewOversight.findUnique({
      where: {
        crewId_userId_role: {
          crewId: input.crewId,
          userId: input.userId,
          role: input.role as 'TCO',
        },
      },
    });
    if (existing && !(input.originScope === 'crew' && existing.id === input.originId)) {
      const saved = await tx.tradeCrewOversight.update({ where: { id: existing.id }, data: dates });
      if (input.originScope === 'crew') await tx.tradeCrewOversight.delete({ where: { id: input.originId } });
      else await tx.tradeTeamOversight.delete({ where: { id: input.originId } });
      return saved;
    }
    if (input.originScope === 'crew') {
      return tx.tradeCrewOversight.update({
        where: { id: input.originId },
        data: { ...dates, crewId: input.crewId, role: input.role as 'TCO' },
      });
    }
    const saved = await tx.tradeCrewOversight.create({
      data: { crewId: input.crewId, userId: input.userId, role: input.role as 'TCO', ...dates },
    });
    await tx.tradeTeamOversight.delete({ where: { id: input.originId } });
    return saved;
  }

  const existing = await tx.tradeTeamOversight.findUnique({
    where: {
      tradeTeamId_userId_role: {
        tradeTeamId: input.tradeTeamId,
        userId: input.userId,
        role: input.role as 'TTO',
      },
    },
  });
  if (existing && !(input.originScope === 'team' && existing.id === input.originId)) {
    const saved = await tx.tradeTeamOversight.update({ where: { id: existing.id }, data: dates });
    if (input.originScope === 'team') await tx.tradeTeamOversight.delete({ where: { id: input.originId } });
    else await tx.tradeCrewOversight.delete({ where: { id: input.originId } });
    return saved;
  }
  if (input.originScope === 'team') {
    return tx.tradeTeamOversight.update({
      where: { id: input.originId },
      data: { ...dates, tradeTeamId: input.tradeTeamId, role: input.role as 'TTO' },
    });
  }
  const saved = await tx.tradeTeamOversight.create({
    data: { tradeTeamId: input.tradeTeamId, userId: input.userId, role: input.role as 'TTO', ...dates },
  });
  await tx.tradeCrewOversight.delete({ where: { id: input.originId } });
  return saved;
}

const STORED_DIRECTORY_PHOTO = /^\/api\/v1\/directory-photos\/[a-zA-Z0-9._-]+$/;

function profileImage(value: unknown): { image: string | null; error?: string } {
  if (value == null || value === '') return { image: null };
  const image = String(value);
  if (STORED_DIRECTORY_PHOTO.test(image)) return { image };
  if (image.length > 400_000) return { image: null, error: 'Photo is too large' };
  if (image.startsWith('data:image/') || image.startsWith('https://')) return { image };
  return { image: null, error: 'Choose an image file' };
}

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
    const photo = profileImage(body.image);
    const role = String(body.role || '');
    const tradeTeamId = String(body.tradeTeamId || '');
    const crewId = body.crewId ? String(body.crewId) : null;
    const isSister = body.isSister === true;
    const startDate = parseDirectoryDate(body.startDate) || new Date();

    if (photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
    const image = photo.image;

    if (!firstName || !lastName || !email || !tradeTeamId) {
      return NextResponse.json({ error: 'Name, email, and trade team are required' }, { status: 400 });
    }
    if (crewId ? !CREW_ROLES.has(role) : !TEAM_ROLES.has(role)) {
      return NextResponse.json({ error: 'Choose a role that matches the team or crew' }, { status: 400 });
    }
    const sisterError = sisterRoleError(isSister, role, crewId);
    if (sisterError) return NextResponse.json({ error: sisterError }, { status: 400 });

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
          isSister,
          ...(image ? { image } : {}),
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
          isSister,
          ...(image ? { image } : {}),
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
    const originScope = body.originScope === 'crew' ? 'crew' : 'team';
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const photo = profileImage(body.image);
    const role = String(body.role || '');
    const tradeTeamId = String(body.tradeTeamId || '');
    const crewId = body.crewId ? String(body.crewId) : null;
    const isSister = body.isSister === true;
    const startDateInput = parseDirectoryDate(body.startDate);
    const endDate = body.endDate === '' || body.endDate == null ? null : parseDirectoryDate(body.endDate);
    const isActive = endDate == null;
    const destScope = crewId ? 'crew' : 'team';

    if (photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
    const image = photo.image;

    if (!id || !firstName || !email || !tradeTeamId) {
      return NextResponse.json({ error: 'Name, email, and trade are required' }, { status: 400 });
    }
    if (destScope === 'crew' ? !CREW_ROLES.has(role) : !TEAM_ROLES.has(role)) {
      return NextResponse.json({ error: 'Choose a role that matches the team or crew' }, { status: 400 });
    }
    const sisterError = sisterRoleError(isSister, role, crewId);
    if (sisterError) return NextResponse.json({ error: sisterError }, { status: 400 });

    const team = await prisma.tradeTeam.findUnique({ where: { id: tradeTeamId } });
    if (!team || !team.isActive) {
      return NextResponse.json({ error: 'Trade team not found' }, { status: 404 });
    }
    if (crewId) {
      const crew = await prisma.crew.findFirst({ where: { id: crewId, tradeTeamId, isActive: true } });
      if (!crew) return NextResponse.json({ error: 'Crew not found on that trade' }, { status: 404 });
    }

    const current = originScope === 'crew'
      ? await prisma.tradeCrewOversight.findUnique({ where: { id }, include: { user: true } })
      : await prisma.tradeTeamOversight.findUnique({ where: { id }, include: { user: true } });
    if (!current) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    if (isActive) {
      const currentCount = destScope === 'crew'
        ? await prisma.tradeCrewOversight.count({
            where: {
              crewId: crewId || '',
              role: role as 'TCO',
              isActive: true,
              ...(originScope === 'crew' ? { NOT: { id } } : {}),
            },
          })
        : await prisma.tradeTeamOversight.count({
            where: {
              tradeTeamId,
              role: role as 'TTO',
              isActive: true,
              ...(originScope === 'team' ? { NOT: { id } } : {}),
            },
          });
      const validation = validateRoleLimit(
        destScope === 'crew' ? TRADE_CREW_OVERSIGHT_CONFIG : TRADE_TEAM_OVERSIGHT_CONFIG,
        role,
        currentCount
      );
      if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== current.userId) {
      return NextResponse.json({ error: 'That email belongs to someone else' }, { status: 409 });
    }
    await prisma.user.update({
      where: { id: current.userId },
      data: { email, firstName, lastName, isSister, image, name: `${firstName} ${lastName}`.trim() },
    });
    await ensureVolunteer(current.userId, team.constructionGroupId, {
      firstName,
      lastName,
      email,
      phone,
    });
    const saved = await prisma.$transaction((tx) => moveAssignment(tx, {
      originScope,
      originId: id,
      userId: current.userId,
      tradeTeamId,
      crewId,
      role,
      isActive,
      startDate: startDateInput || current.startDate,
      endDate,
    }));
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
