import type {
  WorkSession,
  WorkSessionConfig,
  WorkSessionStatus,
} from '../types/workSession';
import {
  entitlementEnd,
  HOUR_MS,
  validateInterval,
} from '../../functions/src/workSessions/model';

export const manualWorkAvailable = (
  config: WorkSessionConfig,
  user: Record<string, unknown> | null,
  now: number,
) =>
  config.enabled &&
  !!user &&
  entitlementEnd(user) > now - config.manualEntryMaxAgeDays * 24 * HOUR_MS;

export const workIntervalError = (
  input: {startedAt: number; endedAt: number; note?: string},
  config: WorkSessionConfig,
  now: number,
  user?: Record<string, unknown> | null,
  manual = false,
): string => {
  try {
    validateInterval(input.startedAt, input.endedAt, now, config.hardCapHours);
  } catch (error) {
    return (error as Error).message;
  }
  if ((input.note || '').length > 1000) {
    return 'Notes must contain at most 1000 characters.';
  }
  if (
    manual &&
    now - input.startedAt > config.manualEntryMaxAgeDays * 24 * HOUR_MS
  ) {
    return `Manual work must start within the last ${config.manualEntryMaxAgeDays} days.`;
  }
  if (user && input.endedAt > entitlementEnd(user)) {
    return 'Manual work must finish within your recorded subscription access period.';
  }
  return '';
};

export const quickWorkTimes = (
  session: WorkSession,
  hours: number,
  now: number,
) => {
  const times = {
    startedAt: session.startedAt,
    endedAt: session.startedAt + hours * HOUR_MS,
  };
  return workIntervalError(times, session.timingConfig, now) ? null : times;
};

export const workStatusLabel = (status: WorkSessionStatus) =>
  ({
    active: 'Running',
    needsReview: 'Pending confirmation',
    confirmed: 'Confirmed',
    discarded: 'Discarded',
  }[status]);
export const workStopExplanation = (reason: string | null) =>
  ((
    {
      deadline:
        'The timer reached its saved stop deadline. The estimated interval is not proof of hours worked.',
      jobDeleted:
        'The job was deleted while this timer was running. Your work record was retained.',
      jobCompleted:
        'The job was completed while this timer was running. Confirm when you actually finished.',
      jobCompletionRequested:
        'Completion was requested while this timer was running.',
      jobReassigned: 'The job assignment changed while this timer was running.',
      jobAssignmentRemoved:
        'Your assignment was removed while this timer was running.',
      jobInterrupted: 'The job status changed while this timer was running.',
      cleanerReviewRequested:
        'You chose to enter the actual finish time instead of using clock-out time.',
    } as Record<string, string>
  )[reason || ''] ||
  'Confirm the actual start and finish before these hours count.');
export const workAuditLabel = (action: string) =>
  ((
    {
      clockIn: 'Clocked in',
      clockOut: 'Clocked out',
      addManual: 'Manual record saved',
      confirm: 'Times confirmed',
      edit: 'Times corrected',
      discard: 'Record discarded',
      autoStopped: 'Timer stopped automatically',
      requestReview: 'Actual-time review requested',
      setPlannedFinish: 'Planned finish added',
    } as Record<string, string>
  )[action] || 'Record updated');
export const detailedWorkTime = (time: number, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time));
