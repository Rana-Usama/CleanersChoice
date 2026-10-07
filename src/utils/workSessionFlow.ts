import type {WorkSession} from '../types/workSession';
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

export const formatWorkTime = (time: number, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time));

export const deviceWorkTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
