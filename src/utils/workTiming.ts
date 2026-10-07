import moment from 'moment';

/** Prefer the absolute schedule; missing legacy dates must not become today. */
export const getJobScheduledStart = (job: {
  scheduledStartAt?: {toDate(): Date};
  createdAt?: unknown;
}): Date | null => {
  if (job.scheduledStartAt) {
    try {
      const date = job.scheduledStartAt.toDate();
      if (Number.isFinite(date.getTime())) {return date;}
    } catch {
      // Older jobs may only have the legacy scheduled-date string.
    }
  }
  if (typeof job.createdAt !== 'string') {return null;}
  const parsed = moment(job.createdAt,
    ['YYYY-MM-DD  hh:mm A', 'YYYY-MM-DD hh:mm A'], true);
  return parsed.isValid() ? parsed.toDate() : null;
};

/** Reject malformed inputs rather than stripping them into a different value. */
export const parseExpectedHours = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {return null;}
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {return null;}
  const hours = Number(text);
  return Number.isFinite(hours) && hours > 0 && hours <= 12 ? hours : null;
};

export const formatExpectedHours = (value: unknown): string => {
  const hours = parseExpectedHours(value);
  if (hours === null) {return 'Not specified';}
  const minutes = Math.round(hours * 60);
  const wholeHours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [wholeHours ? `${wholeHours}h` : '', remainder ? `${remainder}m` : '']
    .filter(Boolean).join(' ') || 'Less than 1m';
};

export const parseDefaultHourlyRate = (value: string): number | null => {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {return null;}
  const rate = Number(text);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};
