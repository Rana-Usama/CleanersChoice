import {ServiceLocation} from '../types/admin';

/**
 * "City, State" for the admin views.
 *
 * Services created after the Location.tsx change carry structured
 * `location.city` / `location.state` (see utils/addressComponents.ts), which is
 * what we use whenever it's there.
 *
 * Everything created before that only has `location.name` — a single Google
 * formatted-address string such as:
 *   "123 Main St, Springfield, IL 62704, USA"
 *   "Springfield, IL, USA"
 *   "Austin, TX 78701, USA"
 *
 * So we parse it as a fallback. That is best-effort by nature: the string comes
 * from two different Google endpoints (Places `description` and Geocoding
 * `formatted_address`) and its shape varies by country. The parser is
 * conservative — when it can't confidently identify a city and state it returns
 * the original address rather than guessing, so a row never shows a wrong city.
 */

/** Matches a US state segment: "IL", "IL 62704", "IL 62704-1234". */
const STATE_SEGMENT = /^([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/;

interface ParsedCityState {
  city: string | null;
  state: string | null;
}

export const parseCityStateFromAddress = (
  address?: string | null,
): ParsedCityState => {
  if (!address || typeof address !== 'string') return {city: null, state: null};

  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return {city: null, state: null};

  // Scan from the end so a trailing country segment ("USA") doesn't matter.
  for (let i = parts.length - 1; i >= 1; i--) {
    const match = parts[i].match(STATE_SEGMENT);
    if (match) {
      return {city: parts[i - 1] || null, state: match[1]};
    }
  }

  return {city: null, state: null};
};

/**
 * Display string for a service's location.
 * Falls back through: structured fields -> parsed address -> raw address.
 */
export const formatCityState = (
  location?: ServiceLocation | null,
  fallback: string = 'Location not specified',
): string => {
  if (!location) return fallback;

  // 1. Structured fields written at capture time.
  const city = typeof location.city === 'string' ? location.city.trim() : '';
  const state = typeof location.state === 'string' ? location.state.trim() : '';
  if (city && state) return `${city}, ${state}`;
  if (city) return city;

  // 2. Parse the formatted address we already store.
  const parsed = parseCityStateFromAddress(location.name);
  if (parsed.city && parsed.state) return `${parsed.city}, ${parsed.state}`;
  if (parsed.city) return parsed.city;

  // 3. Nothing confident — show what we have rather than inventing a city.
  if (state) return state;
  return location.name?.trim() || fallback;
};

/** True when we're showing a raw address because city/state couldn't be resolved. */
export const isApproximateLocation = (
  location?: ServiceLocation | null,
): boolean => {
  if (!location) return false;
  if (location.city) return false;
  return !parseCityStateFromAddress(location.name).city;
};
