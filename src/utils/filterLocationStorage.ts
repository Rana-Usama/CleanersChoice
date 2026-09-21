import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTER_LOCATION_KEY = '@filter_location';

export type StoredFilterLocation = {
  latitude: number | null;
  longitude: number | null;
  name: string;
};

const isCoord = (value: any): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * A manually chosen location filter used to live only in Redux, which is a
 * plain createStore with no persistence. A cleaner who picked a location saw
 * it survive until the next cold start (or an OS memory kill) and then dropped
 * back to the "Location Required" empty state with no idea why — the most
 * common form of the "it isn't saving my location" report.
 *
 * Only the three fields the jobs filter actually reads are stored; the richer
 * payload from the Location screen (city/state/postalCode) is deliberately not
 * persisted so this stays a cache of the filter, not a second source of truth.
 */
export const loadFilterLocation =
  async (): Promise<StoredFilterLocation | null> => {
    try {
      const raw = await AsyncStorage.getItem(FILTER_LOCATION_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!isCoord(parsed?.latitude) || !isCoord(parsed?.longitude)) {
        return null;
      }

      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        name: typeof parsed.name === 'string' ? parsed.name : '',
      };
    } catch (err) {
      console.log('Filter location read error:', err);
      return null;
    }
  };

export const saveFilterLocation = async (
  value: StoredFilterLocation | null,
): Promise<void> => {
  try {
    // A cleared filter must remove the key, otherwise clearing it in the UI
    // would silently come back on the next launch.
    if (!value || !isCoord(value.latitude) || !isCoord(value.longitude)) {
      await AsyncStorage.removeItem(FILTER_LOCATION_KEY);
      return;
    }

    await AsyncStorage.setItem(
      FILTER_LOCATION_KEY,
      JSON.stringify({
        latitude: value.latitude,
        longitude: value.longitude,
        name: value.name ?? '',
      }),
    );
  } catch (err) {
    console.log('Filter location write error:', err);
  }
};
