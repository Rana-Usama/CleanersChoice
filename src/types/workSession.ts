export type {WorkSessionConfig, WorkSession, WorkSessionRequest, WorkSessionResult,
  WorkSessionStatus, WorkSessionAction, WorkSessionAudit}
  from '../../functions/src/workSessions/model';

/** Tracking duration is independent of the job's pricing hours. */
export interface JobWorkTiming {
  expectedHours?: number;
  scheduledStartAt?: {toDate(): Date};
  scheduleTimeZone?: string;
}

export interface CleanerWorkPreferences {
  defaultHourlyRate?: number | null;
}
