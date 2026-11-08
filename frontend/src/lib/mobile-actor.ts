import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { closedMobileAccount, readMobileToken } from '@/lib/mobile-session';
import type { CGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { canAssignProjectPersonnel } from '@/lib/project-personnel';

export type MobileActor = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  constructionGroupId: string;
};

export function isMobileAdmin(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function canManageGroup(actor: MobileActor) {
  return canPostWork(actor.id, scopeForActor(actor));
}

const TRADE_TEAM_ROLE_CODES = ['PC', 'PCA', 'PC-Support', 'CGO', 'CGOA', 'CG-Support', 'CGS', 'CGS-Support'];

async function hasVolunteerRole(actor: MobileActor, codes: string[]) {
  const role = await prisma.volunteerRole.findFirst({
    where: {
      isActive: true,
      endDate: null,
      roleCode: { in: codes },
      volunteer: {
        isActive: true,
        constructionGroupId: actor.constructionGroupId,
        user: { id: actor.id },
      },
    },
    select: { id: true },
  });
  return Boolean(role);
}

/** Same people who can create a trade team or crew on the website. */
export async function canCreateTradeTeam(actor: MobileActor) {
  if (isMobileAdmin(actor.role)) return true;
  return hasVolunteerRole(actor, TRADE_TEAM_ROLE_CODES);
}

/** Same people who can create a project on the website: Personnel, oversight, and construction-group staff. */
export async function canCreateProject(actor: MobileActor) {
  if (await canCreateTradeTeam(actor)) return true;
  if (await canManageGroup(actor)) return true;
  return canAssignProjectPersonnel(actor.id, scopeForActor(actor));
}

export function scopeForActor(actor: MobileActor): CGScope {
  return {
    userId: actor.id,
    constructionGroupId: actor.constructionGroupId,
    regionId: null,
    zoneId: null,
    branchId: null,
    userRole: actor.role,
    canViewAllBranches: false,
    canViewAllZones: false,
    canViewZoneRegions: false,
    canManageCG: false,
  };
}

export function mobileGateResponse(user: { status: string; constructionGroupId: string | null } | null) {
  if (!user || closedMobileAccount(user.status)) {
    return NextResponse.json({ error: 'Sign in again. This session is no longer valid.' }, { status: 401 });
  }
  if (!user.constructionGroupId) {
    return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
  }
  return null;
}

export async function requireMobileActor(request: NextRequest): Promise<
  { actor: MobileActor } | { error: NextResponse }
> {
  const token = readMobileToken(request.headers.get('authorization'));
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: { id: true, name: true, email: true, role: true, status: true, constructionGroupId: true },
  });
  const denied = mobileGateResponse(user);
  if (denied || !user?.constructionGroupId) {
    return { error: denied || NextResponse.json({ error: 'No construction group assigned' }, { status: 403 }) };
  }
  return {
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      constructionGroupId: user.constructionGroupId,
    },
  };
}
