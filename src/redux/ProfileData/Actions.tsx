export const PROFILE_DATA = 'PROFILE_DATA'

export const setProfileData = (data:any) => ({
    type: PROFILE_DATA,
    payload: data,
  });

  
  /**
   * Whether the cleaner has saved optional listing details (description /
   * service types). Only drives "Continue…" vs "Update…" labels in the Setup
   * Services flow — it has NOTHING to do with visibility, which is decided by
   * utils/cleanerProfile.ts. Replaces the old PROFILE_COMPLETION percentage.
   */
  export const HAS_SERVICE_DETAILS = 'HAS_SERVICE_DETAILS'

  export const setHasServiceDetails = (data: boolean) => ({
      type: HAS_SERVICE_DETAILS,
      payload: data,
    });
  