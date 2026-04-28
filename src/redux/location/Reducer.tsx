import { LOCATION, FILTER_LOCATION,CLEAR_FILTER_LOCATION } from './Actions';

const initialState = {
  location: {
    latitude: null,
    longitude: null,
    name: '',
  },
  filterLocation: {
    latitude: null,
    longitude: null,
    name: '',
  },
};

export const userLocationReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case LOCATION:
      return {
        ...state,
        location: action.payload,
      };

    case FILTER_LOCATION:
      return {
        ...state,
        filterLocation: {
          latitude: action.payload.latitude ?? null,
          longitude: action.payload.longitude ?? null,
          name: action.payload.name ?? '',
        },
      };

    case CLEAR_FILTER_LOCATION:
      return {
        ...state,
        filterLocation: { latitude: null, longitude: null, name: '' },
      };

    default:
      return state;
  }
};
