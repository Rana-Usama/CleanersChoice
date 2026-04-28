import { AVAILABILITY } from './Actions';

interface AvailabilityState {
  availability: any[]; 
}
interface AvailabilityAction {
  type: typeof AVAILABILITY;
  payload: any[]; 
}

const initialState: AvailabilityState = {
  availability: [],
};

export const cleanerAvailabilityReducer = (
  state = initialState,
  action: AvailabilityAction
): AvailabilityState => {
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
