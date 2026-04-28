export const LOCATION = 'LOCATION';

export const setUserLocation = (data: any) => ({
  type: LOCATION,
  payload: data,
});

export const FILTER_LOCATION = 'FILTER_LOCATION';

export const setFilterLocation = (data: any) => ({
  type: FILTER_LOCATION,
  payload: data,
});

export const CLEAR_FILTER_LOCATION = 'CLEAR_FILTER_LOCATION';

export const clearFilterLocation = () => ({
  type: CLEAR_FILTER_LOCATION,
});
