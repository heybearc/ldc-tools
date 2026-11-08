import { PERSONNEL_ROLE_CODES } from '@/lib/work-items';

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
      { role: { in: ['ADMIN', 'SUPER_ADMIN'] as const } },
      {
        invitedBy: { not: null },
        tradeTeamOversight: { none: { isActive: true, endDate: null } },
        tradeCrewOversight: { none: { isActive: true, endDate: null } },
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
