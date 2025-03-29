import {DESCRIPTION} from './Actions';

const initialState = {
  description: '',
};

export const formReducer = (state = initialState, action) => {
  switch (action.type) {
    case DESCRIPTION:
      return {
        ...state,
        description: action.payload,
      };
    default:
      return state;
  }
};
