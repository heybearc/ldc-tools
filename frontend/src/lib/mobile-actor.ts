import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readMobileToken } from '@/lib/mobile-session';
import type { CGScope } from '@/lib/cg-scope';

export type MobileActor = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  constructionGroupId: string;
};

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
  if (!user || user.status === 'INACTIVE' || !user.constructionGroupId) {
    return { error: NextResponse.json({ error: 'No construction group assigned' }, { status: 403 }) };
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
