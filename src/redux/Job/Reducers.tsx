import {JOB_ID} from './Actions';

const initialState = {
  jobId: '',
};

export const jobReducer = (state = initialState, action) => {
  switch (action.type) {
    case JOB_ID:
      return {
        ...state,
        jobId: action.payload,
      };
    default:
      return state;
  }
};
