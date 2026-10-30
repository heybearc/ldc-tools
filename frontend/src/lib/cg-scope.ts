// Multi-tenant Construction Group Scope Utilities
// Provides data isolation based on user's CG assignment

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export interface CGScope {
  userId: string;
  constructionGroupId: string | null;
  regionId: string | null;
  zoneId: string | null;
  branchId: string | null;
  userRole: string;
  // Permission flags
  canViewAllBranches: boolean;
  canViewAllZones: boolean;
  canViewZoneRegions: boolean;
  canManageCG: boolean;
}

const constructionGroupScopeInclude = {
  region: {
    include: {
      zone: {
        include: { branch: true },
      },
    },
  },
} as const;

async function constructionGroupForUser(userId: string, email: string | null | undefined) {
  const volunteer = await prisma.volunteer.findFirst({
    where: {
      isActive: true,
      OR: [
        { user: { id: userId } },
        ...(email
          ? [
              { emailPersonal: { equals: email, mode: 'insensitive' as const } },
              { emailJw: { equals: email, mode: 'insensitive' as const } },
            ]
          : []),
      ],
    },
    include: { constructionGroup: { include: constructionGroupScopeInclude } },
  });
  if (volunteer?.constructionGroup) return volunteer.constructionGroup;

  const contact = await prisma.personnelContact.findFirst({
    where: { userId, isActive: true, endDate: null },
    include: { constructionGroup: { include: constructionGroupScopeInclude } },
    orderBy: { startDate: 'desc' },
  });
  return contact?.constructionGroup || null;
}

// Roles that can see all data across branches
const BRANCH_LEVEL_ROLES = ['SUPER_ADMIN'];

// Roles that can see all data within their zone
const ZONE_LEVEL_ROLES = [
  'SUPER_ADMIN',
  'ZONE_OVERSEER',
  'ZONE_OVERSEER_ASSISTANT',
  'ZONE_OVERSEER_SUPPORT',
];

// Roles that can manage their CG (create/edit data)
const CG_MANAGER_ROLES = [
  'SUPER_ADMIN',
  'ZONE_OVERSEER',
  'ZONE_OVERSEER_ASSISTANT',
  'CONSTRUCTION_GROUP_OVERSEER',
  'CONSTRUCTION_GROUP_OVERSEER_ASSISTANT',
  'PERSONNEL_CONTACT',
  'PERSONNEL_CONTACT_ASSISTANT',
];

/**
 * Get the current user's CG scope from their session
 * Returns null if not authenticated
 * For SUPER_ADMIN: checks cg_filter cookie to allow viewing specific CG or all CGs
 */
export async function getCGScope(): Promise<CGScope | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      volunteer: {
        include: {
          constructionGroup: {
            include: {
              region: {
                include: {
                  zone: {
                    include: { branch: true },
                  },
                },
              },
            },
          },
        },
      },
      constructionGroup: {
        include: {
          region: {
            include: {
              zone: {
                include: { branch: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const role = user.role;

  // Derive CG from linked volunteer (source of truth)
  // Fall back to user.constructionGroup for break-glass SUPER_ADMIN accounts
  let cg = user.volunteer?.constructionGroup || user.constructionGroup || null;

  if (!cg) {
    cg = await constructionGroupForUser(user.id, user.email);
  }

  // SUPER_ADMIN stays in their own group unless they explicitly choose All or another group.
  // A missing cookie used to mean "all groups", which blocked Work and Projects.
  if (role === 'SUPER_ADMIN') {
    const cookieStore = await cookies();
    const cgFilter = cookieStore.get('cg_filter')?.value;

    if (cgFilter === 'all') {
      cg = null;
    } else if (cgFilter) {
      const selectedCG = await prisma.constructionGroup.findUnique({
        where: { id: cgFilter },
        include: constructionGroupScopeInclude,
      });

      if (selectedCG) {
        cg = selectedCG;
      }
    }
  }

  return {
    userId: user.id,
    constructionGroupId: cg?.id || null,
    regionId: cg?.region?.id || null,
    zoneId: cg?.region?.zone?.id || null,
    branchId: cg?.region?.zone?.branch?.id || null,
    userRole: role,
    canViewAllBranches: BRANCH_LEVEL_ROLES.includes(role),
    canViewAllZones: BRANCH_LEVEL_ROLES.includes(role),
    canViewZoneRegions: ZONE_LEVEL_ROLES.includes(role),
    canManageCG: CG_MANAGER_ROLES.includes(role),
  };
}

/**
 * Build a Prisma where clause filter based on user's CG scope
 * Use this to filter queries for CG-scoped data
 */
export function withCGFilter(
  scope: CGScope,
  options: {
    // Allow viewing data from other CGs (for cross-CG features)
    allowCrossZone?: boolean;
    // Field name for the CG ID (default: 'constructionGroupId')
    cgField?: string;
  } = {}
): Record<string, unknown> {
  const { allowCrossZone = false, cgField = 'constructionGroupId' } = options;

  // Super admin with no CG filter sees everything
  if (scope.canViewAllBranches && !scope.constructionGroupId) {
    return {};
  }

  // If a specific CG is set (e.g., SUPER_ADMIN filtered to a specific CG), use it
  if (scope.constructionGroupId) {
    return {
      [cgField]: scope.constructionGroupId,
    };
  }

  // Zone-level users see all CGs in their zone
  if (scope.canViewZoneRegions && scope.zoneId) {
    return {
      constructionGroup: {
        region: {
          zoneId: scope.zoneId,
        },
      },
    };
  }

  // No CG assigned - return impossible filter (no results)
  return {
    [cgField]: 'NO_CG_ASSIGNED',
  };
}

/**
 * Check if user can access a specific CG's data
 */
export function canAccessCG(scope: CGScope, targetCGId: string): boolean {
  // Super admin can access any CG
  if (scope.canViewAllBranches) return true;

  // Zone-level users need to check if target CG is in their zone
  // This would require a DB lookup - for now, just check own CG
  if (scope.constructionGroupId === targetCGId) return true;

  return false;
}

/**
 * Get the user's effective CG ID for creating new records
 * Super admins may have a "selected" CG context
 */
export function getEffectiveCGId(
  scope: CGScope,
  selectedCGId?: string | null
): string | null {
  // If super admin has selected a specific CG, use that
  if (scope.canViewAllBranches && selectedCGId) {
    return selectedCGId;
  }

  // Otherwise use the user's assigned CG
  return scope.constructionGroupId;
}

/**
 * Validate that a user can create/modify data in a specific CG
 */
export function canManageInCG(scope: CGScope, targetCGId: string): boolean {
  if (!scope.canManageCG) return false;

  // Super admin can manage any CG
  if (scope.canViewAllBranches) return true;

  // Zone-level managers can manage CGs in their zone
  // (would need DB lookup to verify - simplified for now)
  if (scope.canViewZoneRegions) return true;

  // CG-level managers can only manage their own CG
  return scope.constructionGroupId === targetCGId;
}

/**
 * Get list of CGs the user can access (for dropdowns, etc.)
 */
export async function getAccessibleCGs(scope: CGScope) {
  // Super admin sees all CGs
  if (scope.canViewAllBranches) {
    return prisma.constructionGroup.findMany({
      where: { isActive: true },
      include: {
        region: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: [
        { region: { zone: { code: 'asc' } } },
        { region: { code: 'asc' } },
        { code: 'asc' },
      ],
    });
  }

  // Zone-level users see CGs in their zone
  if (scope.canViewZoneRegions && scope.zoneId) {
    return prisma.constructionGroup.findMany({
      where: {
        isActive: true,
        region: {
          zoneId: scope.zoneId,
        },
      },
      include: {
        region: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: [{ region: { code: 'asc' } }, { code: 'asc' }],
    });
  }

  // Regular users see only their CG
  if (scope.constructionGroupId) {
    return prisma.constructionGroup.findMany({
      where: {
        id: scope.constructionGroupId,
        isActive: true,
      },
      include: {
        region: {
          include: {
            zone: true,
          },
        },
      },
    });
  }

  return [];
}
