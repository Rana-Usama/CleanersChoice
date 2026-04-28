import {USER_FLOW} from './Actions';

const initialState = {
  userFlow: '',
};

export const userFlowReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case USER_FLOW:
      return {
        ...state,
        userFlow: action.payload,
      };
    default:
      return state;
  }
};
