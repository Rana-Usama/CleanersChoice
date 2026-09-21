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

export const HYDRATE_FILTER_LOCATION = 'HYDRATE_FILTER_LOCATION';

/**
 * Restores the persisted filter on launch. Handled separately from
 * FILTER_LOCATION so the reducer can ignore it once the user has already
 * touched the filter in this session (see the reducer's guard).
 */
export const hydrateFilterLocation = (data: any) => ({
  type: HYDRATE_FILTER_LOCATION,
  payload: data,
});
