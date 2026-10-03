import {HAS_SERVICE_DETAILS, PROFILE_DATA} from './Actions';

const initialState = {
  profileData: [],
  hasServiceDetails: false,
};

export const userDataReducer = (state = initialState, action:any) => {
  switch (action.type) {
    case PROFILE_DATA:
      return {
        ...state,
        profileData: action.payload,
      };
      case HAS_SERVICE_DETAILS:
      return {
        ...state,
        hasServiceDetails: !!action.payload,
      };
    default:
      return state;
  }
};
