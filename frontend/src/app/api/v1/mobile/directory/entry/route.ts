import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { storedPhone } from '@/lib/phone-utils';
import {
  TRADE_CREW_OVERSIGHT_CONFIG,
  TRADE_TEAM_OVERSIGHT_CONFIG,
  validateRoleLimit,
} from '@/lib/oversight-types';

const TEAM_ROLES = new Set(['TTO', 'TTOA', 'TT_SUPPORT']);
const CREW_ROLES = new Set(['TCO', 'TCOA', 'TC_SUPPORT']);
const STORED_DIRECTORY_PHOTO = /^\/api\/v1\/directory-photos\/[a-zA-Z0-9._-]+$/;

function profileImage(value: unknown): { image: string | null; error?: string } {
  if (value == null || value === '') return { image: null };
  const image = String(value);
  if (STORED_DIRECTORY_PHOTO.test(image)) return { image };
  if (image.length > 400_000) return { image: null, error: 'Photo is too large' };
  if (image.startsWith('data:image/') || image.startsWith('https://')) return { image };
  return { image: null, error: 'Choose an image file' };
}

function supportRole(crewId: string | null) {
  return crewId ? 'TC_SUPPORT' : 'TT_SUPPORT';
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const body = await request.json().catch(() => ({}));
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const parsedPhone = storedPhone(body.phone);
    if (parsedPhone.error) return NextResponse.json({ error: parsedPhone.error }, { status: 400 });
    const phone = parsedPhone.phone;
    const photo = profileImage(body.image);
    if (photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const assignmentId = String(body.assignmentId || '');
    const scope = body.scope === 'crew' ? 'crew' : body.scope === 'team' ? 'team' : null;
    const nextRole = body.role ? String(body.role) : '';

    if (assignmentId && scope) {
      const saved = scope === 'crew'
        ? await updateCrew(actor.constructionGroupId, assignmentId, { firstName, lastName, email, phone, image: photo.image, role: nextRole })
        : await updateTeam(actor.constructionGroupId, assignmentId, { firstName, lastName, email, phone, image: photo.image, role: nextRole });
      if ('error' in saved) return NextResponse.json({ error: saved.error }, { status: saved.status });
      return NextResponse.json({ ok: true });
    }

    const userId = String(body.userId || '');
    if (!userId) return NextResponse.json({ error: 'Choose a person to update' }, { status: 400 });
    const user = await prisma.user.findFirst({
      where: { id: userId, constructionGroupId: actor.constructionGroupId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'That person is not in this construction group' }, { status: 404 });
    await saveUser(user.id, actor.constructionGroupId, { firstName, lastName, email, phone, image: photo.image });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile directory update error:', error);
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === 'P2002') {
      return NextResponse.json({ error: 'That email or role is already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not save this person' }, { status: 500 });
  }
}

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
};

async function updateCrew(groupId: string, id: string, profile: Profile) {
  const current = await prisma.tradeCrewOversight.findFirst({
    where: { id, crew: { tradeTeam: { constructionGroupId: groupId } } },
    include: { user: true, contact: true },
  });
  if (!current) return { error: 'Entry not found', status: 404 };
  if (profile.role && !CREW_ROLES.has(profile.role)) return { error: 'Choose a crew role', status: 400 };
  const sister = current.user?.isSister === true || current.contact?.isSister === true;
  if (sister && profile.role && profile.role !== supportRole(current.crewId)) {
    return { error: 'Sisters can only be Support', status: 400 };
  }
  if (profile.role && profile.role !== current.role && current.isActive) {
    const count = await prisma.tradeCrewOversight.count({
      where: { crewId: current.crewId, role: profile.role as 'TCO', isActive: true, NOT: { id } },
    });
    const validation = validateRoleLimit(TRADE_CREW_OVERSIGHT_CONFIG, profile.role, count);
    if (!validation.valid) return { error: validation.message || 'That role is full', status: 400 };
  }
  await writeProfile(current.userId, current.contactId, groupId, profile);
  if (profile.role && profile.role !== current.role) {
    await prisma.tradeCrewOversight.update({
      where: { id },
      data: { role: profile.role as 'TCO' },
    });
  }
  return { ok: true as const };
}

async function updateTeam(groupId: string, id: string, profile: Profile) {
  const current = await prisma.tradeTeamOversight.findFirst({
    where: { id, tradeTeam: { constructionGroupId: groupId } },
    include: { user: true, contact: true },
  });
  if (!current) return { error: 'Entry not found', status: 404 };
  if (profile.role && !TEAM_ROLES.has(profile.role)) return { error: 'Choose a team role', status: 400 };
  const sister = current.user?.isSister === true || current.contact?.isSister === true;
  if (sister && profile.role && profile.role !== supportRole(null)) {
    return { error: 'Sisters can only be Support', status: 400 };
  }
  if (profile.role && profile.role !== current.role && current.isActive) {
    const count = await prisma.tradeTeamOversight.count({
      where: { tradeTeamId: current.tradeTeamId, role: profile.role as 'TTO', isActive: true, NOT: { id } },
    });
    const validation = validateRoleLimit(TRADE_TEAM_OVERSIGHT_CONFIG, profile.role, count);
    if (!validation.valid) return { error: validation.message || 'That role is full', status: 400 };
  }
  await writeProfile(current.userId, current.contactId, groupId, profile);
  if (profile.role && profile.role !== current.role) {
    await prisma.tradeTeamOversight.update({
      where: { id },
      data: { role: profile.role as 'TTO' },
    });
  }
  return { ok: true as const };
}

async function writeProfile(
  userId: string | null,
  contactId: string | null,
  groupId: string,
  profile: Profile,
) {
  if (userId) {
    const owner = await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true } });
    if (owner && owner.id !== userId) {
      throw Object.assign(new Error('email'), { code: 'P2002' });
    }
    await saveUser(userId, groupId, profile);
    return;
  }
  if (!contactId) return;
  const other = await prisma.directoryContact.findFirst({
    where: { constructionGroupId: groupId, email: profile.email, NOT: { id: contactId } },
    select: { id: true },
  });
  if (other) throw Object.assign(new Error('email'), { code: 'P2002' });
  await prisma.directoryContact.update({
    where: { id: contactId },
    data: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      image: profile.image,
    },
  });
}

async function saveUser(userId: string, groupId: string, profile: Omit<Profile, 'role'>) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      image: profile.image,
    },
  });
  const volunteer = await prisma.volunteer.findFirst({ where: { user: { id: userId } }, select: { id: true } });
  if (volunteer) {
    await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailPersonal: profile.email,
        phone: profile.phone,
      },
    });
  } else {
    const created = await prisma.volunteer.create({
      data: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailPersonal: profile.email,
        phone: profile.phone,
        constructionGroupId: groupId,
        isActive: true,
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { volunteerId: created.id } });
  }
}
