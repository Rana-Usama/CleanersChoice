import {PROFILE_COMPLETION, PROFILE_DATA} from './Actions';

const initialState = {
  profileData: [],
  profileCompletion : ''
};

export const userDataReducer = (state = initialState, action:any) => {
  switch (action.type) {
    case PROFILE_DATA:
      return {
        ...state,
        profileData: action.payload,
      };
      case PROFILE_COMPLETION:
      return {
        ...state,
        profileCompletion: action.payload,
      };
    default:
      return state;
  }
};
