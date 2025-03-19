import {USER_FLOW} from './Actions';


const initialState = {
  userFlow : ''
};

export const userFlowReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_FLOW:
      return {...state, ...action.payload};
    default:
      return state;
  }
};