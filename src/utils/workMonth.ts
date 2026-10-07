import {HOUR_MS} from '../../functions/src/workSessions/model';

export type WorkMonth = {year: number; month: number};
const DAY_MS = 24 * HOUR_MS;
const boundsCache = new Map<string, {from: number; to: number}>();

export const shiftWorkMonth = (value: WorkMonth, delta: number): WorkMonth => {
  const date = new Date(Date.UTC(value.year, value.month + delta, 1));
  return {year: date.getUTCFullYear(), month: date.getUTCMonth()};
};

/** Wide enough for every saved reporting zone; the session reader adds the 12h lookback. */
export const workMonthQueryRange = ({year, month}: WorkMonth) => ({
  from: Date.UTC(year, month, 1) - DAY_MS,
  to: Date.UTC(year, month + 1, 1) + DAY_MS,
});

// Find the first instant in the local calendar month. No device offset, 30-day
// approximation, or assumed DST offset is involved in this boundary.
const localMonthStart = ({year, month}: WorkMonth, zone: string): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: 'numeric',
  });
  const nominal = Date.UTC(year, month, 1);
  const target = year * 12 + month;
  let low = nominal - DAY_MS;
  let high = nominal + DAY_MS;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const parts = formatter.formatToParts(new Date(middle));
    const localYear = Number(parts.find(part => part.type === 'year')?.value);
    const localMonth =
      Number(parts.find(part => part.type === 'month')?.value) - 1;
    if (localYear * 12 + localMonth >= target) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
};

export const workMonthBounds = (value: WorkMonth, zone: string) => {
  const key = `${value.year}:${value.month}:${zone}`;
  const cached = boundsCache.get(key);
  if (cached) {
    return cached;
  }
  const bounds = {
    from: localMonthStart(value, zone),
    to: localMonthStart(shiftWorkMonth(value, 1), zone),
  };
  if (boundsCache.size >= 100) {
    boundsCache.clear();
  }
  boundsCache.set(key, bounds);
  return bounds;
};

export const workTimeInMonth = (
  startedAt: number,
  endedAt: number,
  value: WorkMonth,
  zone: string,
): number => {
  const {from, to} = workMonthBounds(value, zone);
  return Math.max(0, Math.min(endedAt, to) - Math.max(startedAt, from));
};
