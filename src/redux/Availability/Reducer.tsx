import {AVAILABILITY} from './Actions';

const initialState = {
  availability: [],
};

export const cleanerAvailablityReducer = (state = initialState, action) => {
  switch (action.type) {
    case AVAILABILITY:
      return {
        ...state,
        availability: action.payload,
      };
      
    default:
      return state;
  }
};
