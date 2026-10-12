import {validWorkEarnings} from '../../functions/src/workSessions/model';

/** Blank retains compatibility with hours-only records; zero is an explicit amount. */
export const parseWorkEarnings = (text: string): number | undefined => {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const amount = Number(trimmed);
  return /^\d+(?:\.\d{1,2})?$/.test(trimmed) && validWorkEarnings(amount)
    ? amount
    : NaN;
};
export const workEarningsError = (text: string, required = false): string => {
  const amount = parseWorkEarnings(text);
  return (required && amount === undefined) || Number.isNaN(amount)
    ? 'Enter an amount from $0 to $1,000,000 with up to two decimal places.'
    : '';
};
