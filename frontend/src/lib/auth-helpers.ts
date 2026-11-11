import { Session } from 'next-auth';

/**
 * Check if user has admin privileges
 * Checks both role and adminLevel fields
 * Accepts: ADMIN, SUPER_ADMIN (in either role or adminLevel)
 */
export function isAdmin(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  const role = session.user.role?.toUpperCase();
  const adminLevel = (session.user as any).adminLevel?.toUpperCase();
  
  // Check both role and adminLevel
  return role === 'ADMIN' || 
         role === 'SUPER_ADMIN' || 
         adminLevel === 'ADMIN' || 
         adminLevel === 'SUPER_ADMIN' ||
         adminLevel === 'READ_ONLY_ADMIN';
}

/**
 * Check if user has super admin privileges
 * Checks both role and adminLevel fields
 */
export function isSuperAdmin(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  const role = session.user.role?.toUpperCase();
  const adminLevel = (session.user as any).adminLevel?.toUpperCase();
  
  return role === 'SUPER_ADMIN' || adminLevel === 'SUPER_ADMIN';
}

/**
 * Check if user has read-only admin access
 */
export function isReadOnlyAdmin(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  const adminLevel = (session.user as any).adminLevel?.toUpperCase();
  return adminLevel === 'READ_ONLY_ADMIN';
}

const PLATFORM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER', 'READ_ONLY'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * Map a create/invite access choice onto User.role.
 * READ_ONLY_ADMIN is an adminLevel, not a UserRole.
 */
export function resolvePlatformRole(input: string): {
  role: PlatformRole;
  adminLevel?: 'READ_ONLY_ADMIN';
} | null {
  const value = input.trim().toUpperCase();
  if (value === 'READ_ONLY_ADMIN') {
    return { role: 'READ_ONLY', adminLevel: 'READ_ONLY_ADMIN' };
  }
  if ((PLATFORM_ROLES as readonly string[]).includes(value)) {
    return { role: value as PlatformRole };
  }
  return null;
}
