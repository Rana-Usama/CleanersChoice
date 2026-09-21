import {
  LOCATION,
  FILTER_LOCATION,
  CLEAR_FILTER_LOCATION,
  HYDRATE_FILTER_LOCATION,
} from './Actions';

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
        filterLocation: {latitude: null, longitude: null, name: ''},
      };

    /**
     * Rehydration is async, so it can land after the user has already picked
     * or cleared a filter in this session. Applying it then would resurrect a
     * stale filter, so it only fills an untouched slot.
     */
    case HYDRATE_FILTER_LOCATION: {
      const {latitude, longitude} = state.filterLocation;
      if (latitude || longitude) return state;
      if (!action.payload?.latitude || !action.payload?.longitude) return state;

      return {
        ...state,
        filterLocation: {
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
          name: action.payload.name ?? '',
        },
      };
    }

    default:
      return state;
  }
};
