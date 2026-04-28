import { DESCRIPTION } from './Actions';

interface FormState {
  description: string;
}

interface DescriptionAction {
  type: typeof DESCRIPTION;
  payload: string;
}

// Initial state
const initialState: FormState = {
  description: '',
};

export const formReducer = (
  state: FormState = initialState,
  action: DescriptionAction
): FormState => {
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
