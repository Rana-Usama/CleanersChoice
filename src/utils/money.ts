/**
 * Money and quantity parsing for job pricing.
 *
 * The original parsers stripped every non-digit, including the decimal point,
 * so "$50.50" became 5050 and "$22.50/hr" became 2250 - a hundredfold error.
 * That ran on the WRITE path in PostJob, so the corrupted value was stored, and
 * `hourlyRate` is read straight into a work session's paySnapshot.
 *
 * Historical rows are NOT repaired anywhere in the codebase: a stored 5050
 * cannot be distinguished from a genuine $5,050 job, and guessing at money is
 * not a decision code should make.
 */

/** Largest value accepted, to reject digit-mashed input outright. */
const MAX_MONEY = 1_000_000;

/**
 * Parse a money amount from user input or a stored field, keeping cents.
 * Returns 0 for anything unusable, so callers can treat 0 as "no amount".
 */
export const parseMoney = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0
      ? Math.min(roundMoney(value), MAX_MONEY)
      : 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  // Keep digits and the first decimal point; drop currency symbols, commas,
  // spaces and any stray second separator.
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const normalised =
    parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
  const amount = Number(normalised);
  return Number.isFinite(amount) && amount > 0
    ? Math.min(roundMoney(amount), MAX_MONEY)
    : 0;
};

/** Two-decimal rounding that does not drift on values like 0.1 + 0.2. */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * The canonical string form to store in Firestore. The server's `positiveRate`
 * accepts `\d+(\.\d{1,2})?`, so this is the shape it expects.
 */
export const moneyToStored = (value: number): string =>
  value > 0 ? String(roundMoney(value)) : '';

/**
 * Parse a count that may legitimately carry a fraction - expected hours are
 * validated elsewhere with "e.g. 2.5", so parseInt was wrong for them too.
 */
export const parseQuantity = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

/** Display helper: "$50.50", or "$50" when the amount is whole. */
export const formatMoney = (value: number): string => {
  const rounded = roundMoney(value);
  return `$${
    Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  }`;
};
