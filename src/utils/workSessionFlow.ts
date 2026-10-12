import type {WorkSession} from '../types/workSession';
import {cachedDateFormatter, cachedDeviceTimeZone} from './intlCache';
import {hasAcceptedInstructions} from './cleanerInstructions';
import {
  hasRequiredCleanerProfile,
  requiredFieldsFromUser,
} from './cleanerProfile';
import {
  hasActiveSubscriptionAccess,
  isAccountActive,
} from './cleanerVisibility';

export const canUseWorkRecords = (user?: Record<string, any> | null): boolean =>
  user?.role === 'Cleaner' &&
  isAccountActive(user) &&
  user.subscriptionStatus !== 'refunded' &&
  hasAcceptedInstructions(user) &&
  hasRequiredCleanerProfile(requiredFieldsFromUser(user));

export const canStartWork = (
  user?: Record<string, any> | null,
  now = Date.now(),
): boolean => canUseWorkRecords(user) && hasActiveSubscriptionAccess(user, now);

export const workSessionPhase = (session: WorkSession, now: number) => {
  if (session.status !== 'active') {
    return session.status;
  }
  if (now >= session.autoStopAt) {
    return 'overdue';
  }
  if (session.expectedEndAt !== null && now >= session.expectedEndAt) {
    return 'checkIn';
  }
  return 'working';
};

export const formatWorkDuration = (ms: number) => {
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

/**
 * Elapsed time as HH:MM:SS for the live running-session timers. Distinct from
 * formatWorkDuration, which renders settled totals as "2h 30m".
 */
export const formatWorkTimer = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(
    Math.floor((total % 3600) / 60),
  )}:${pad(total % 60)}`;
};

export const formatWorkTime = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time));

export const deviceWorkTimeZone = (): string => cachedDeviceTimeZone();

/** Job titles remain authoritative; older unlinked records retain their fallback. */
export const workSessionTitle = (session: WorkSession): string =>
  session.jobSnapshot?.title || session.workName?.trim() || 'General work';
