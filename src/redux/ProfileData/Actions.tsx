export const PROFILE_DATA = 'PROFILE_DATA'

export const setProfileData = (data:any) => ({
    type: PROFILE_DATA,
    payload: data,
  });

  
  export const PROFILE_COMPLETION = 'PROFILE_COMPLETION'

  export const setProfileCompletion = (data:any) => ({
      type: PROFILE_COMPLETION,
      payload: data,
    });
  