import { JOB_ID } from './Actions';

interface JobState {
  jobId: string;
}

interface JobAction {
  type: typeof JOB_ID;
  payload: string;
}

const initialState: JobState = {
  jobId: '',
};

export const jobReducer = (
  state: JobState = initialState,
  action: JobAction
): JobState => {
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
