import { PERSONNEL_ROLE_CODES } from '@/lib/work-items';

const SIGN_IN_ADMIN_ROLES: Array<'ADMIN' | 'SUPER_ADMIN'> = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Users who serve on the Personnel team (Contact, Assistant, or Support)
 * for a region. Directory contacts without one of those roles stay off this list.
 */
/** Sign-in accounts for one construction group: the personnel team, admins, and people an admin invited who are not a trade or crew contact. */
export function mobileSignInAccountWhere(constructionGroupId: string) {
  return {
    constructionGroupId,
    OR: [
      {
        volunteer: {
          isActive: true,
          constructionGroupId,
          roles: {
            some: {
              isActive: true,
              endDate: null,
              roleCode: { in: [...PERSONNEL_ROLE_CODES] },
            },
          },
        },
      },
      {
        personnelContacts: {
          some: {
            isActive: true,
            endDate: null,
            constructionGroupId,
          },
        },
      },
      { role: { in: SIGN_IN_ADMIN_ROLES } },
      {
        invitedBy: { not: null },
        tradeTeamOversight: { none: { isActive: true, endDate: null } },
        tradeCrewOversight: { none: { isActive: true, endDate: null } },
      },
    ],
  };
}

/** Sign-in accounts an admin can manage: personnel, admins, and invited people who are not trade or crew contacts. */
export function adminSignInAccountWhere(scope: { constructionGroupId: string | null; regionId: string | null } | null) {
  if (scope?.constructionGroupId) return mobileSignInAccountWhere(scope.constructionGroupId);

  const regionId = scope?.regionId || null;
  const inScope = regionId ? { constructionGroup: { regionId } } : {};
  return {
    AND: [
      inScope,
      {
        OR: [
          {
            volunteer: {
              isActive: true,
              ...inScope,
              roles: {
                some: {
                  isActive: true,
                  endDate: null,
                  roleCode: { in: [...PERSONNEL_ROLE_CODES] },
                },
              },
            },
          },
          {
            personnelContacts: {
              some: {
                isActive: true,
                endDate: null,
                ...inScope,
              },
            },
          },
          { role: { in: SIGN_IN_ADMIN_ROLES } },
          {
            invitedBy: { not: null },
            tradeTeamOversight: { none: { isActive: true, endDate: null } },
            tradeCrewOversight: { none: { isActive: true, endDate: null } },
          },
        ],
      },
    ],
  };
}

export function personnelAccountWhere(regionId: string | null) {
  const inRegion = regionId ? { constructionGroup: { regionId } } : {};

  return {
    OR: [
      {
        volunteer: {
          isActive: true,
          ...inRegion,
          roles: {
            some: {
              isActive: true,
              endDate: null,
              roleCode: { in: [...PERSONNEL_ROLE_CODES] },
            },
          },
        },
      },
      {
        personnelContacts: {
          some: {
            isActive: true,
            endDate: null,
            ...inRegion,
          },
        },
      },
    ],
  };
}
