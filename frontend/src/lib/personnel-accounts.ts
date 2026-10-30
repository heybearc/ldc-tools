import { PERSONNEL_ROLE_CODES } from '@/lib/work-items';

/**
 * Users who serve on the Personnel team (Contact, Assistant, or Support)
 * for a region. Directory contacts without one of those roles stay off this list.
 */
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
