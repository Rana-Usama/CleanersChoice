export interface WorkSessionConfig {
  enabled: boolean;
  graceHours: number;
  hardCapHours: number;
  manualEntryMaxAgeDays: number;
}

export const DEFAULT_WORK_SESSION_CONFIG: Readonly<WorkSessionConfig> = Object.freeze({
  enabled: false, graceHours: 3, hardCapHours: 12, manualEntryMaxAgeDays: 7,
});
export const REQUIRED_INSTRUCTIONS_VERSION = 2;
export const HOUR_MS = 3600000;

export const parseWorkSessionConfig = (raw: unknown): WorkSessionConfig => {
  if (!raw || typeof raw !== "object") return {...DEFAULT_WORK_SESSION_CONFIG};
  const data = raw as Record<string, unknown>;
  const hours = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 12;
  const valid = typeof data.enabled === "boolean" && hours(data.graceHours) && hours(data.hardCapHours) &&
    data.graceHours <= data.hardCapHours && typeof data.manualEntryMaxAgeDays === "number" &&
    Number.isInteger(data.manualEntryMaxAgeDays) && data.manualEntryMaxAgeDays >= 1 && data.manualEntryMaxAgeDays <= 30;
  return valid ? {
    enabled: data.enabled as boolean, graceHours: data.graceHours as number,
    hardCapHours: data.hardCapHours as number, manualEntryMaxAgeDays: data.manualEntryMaxAgeDays as number,
  } : {...DEFAULT_WORK_SESSION_CONFIG};
};

export type WorkSessionStatus = "active" | "needsReview" | "confirmed" | "discarded";
export type WorkSessionAction = "clockIn" | "clockOut" | "addManual" | "confirm" | "edit" | "discard" |
  "reconcile" | "requestReview" | "setPlannedFinish";

export interface WorkSessionRequest {
  action: WorkSessionAction;
  requestId: string;
  sessionId?: string;
  jobId?: string | null;
  reportingTimeZone?: string;
  plannedFinishAt?: number;
  startedAt?: number;
  endedAt?: number;
  note?: string;
  expectedRevision?: number;
}

export interface SessionTimes {
  startedAt: number;
  endedAt: number | null;
  status: WorkSessionStatus;
}

export interface WorkSessionAudit {
  action: string;
  actorId: string;
  at: number;
  before: SessionTimes | null;
  after: SessionTimes;
  note: string;
  stopReason?: string;
  eventId?: string;
}

export interface WorkSession {
  id: string;
  cleanerId: string;
  jobId: string | null;
  jobSnapshot: {
    title: string;
    customerId: string | null;
    scheduledStartAt: number | null;
    expectedHours: number | null;
    scheduleTimeZone: string | null;
  } | null;
  paySnapshot: {
    basis: "flat" | "hourly" | "sqft" | "general";
    hourlyRate: number | null;
    rateSource: "job" | "cleanerDefault" | "unavailable";
    capturedAt: number;
  };
  reportingTimeZone: string;
  source: "clock" | "manualCleaner";
  status: WorkSessionStatus;
  startedAt: number;
  endedAt: number | null;
  expectedEndAt: number | null;
  autoStopAt: number;
  timingConfig: WorkSessionConfig;
  durationMs: number;
  estimatedDurationMs: number;
  stopReason: string | null;
  note: string;
  editHistory: WorkSessionAudit[];
  createdAt: number;
  updatedAt: number;
  revision?: number;
}

export interface WorkSessionResult {
  sessionId: string;
  status: WorkSessionStatus;
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  revision?: number;
}

export class WorkSessionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "WorkSessionError";
  }
}

export const fail = (code: string, message: string): never => {
  throw new WorkSessionError(code, message);
};

export const finiteTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export const validateInterval = (start: unknown, end: unknown, now: number, capHours: number): void => {
  if (!finiteTime(start) || !finiteTime(end) || start >= end || end > now) {
    fail("invalid-argument", "Enter valid start and finish times, with finish after start and not in the future.");
  }
  if ((end as number) - (start as number) > capHours * HOUR_MS) {
    fail("invalid-argument", `A work session cannot exceed ${capHours} hours.`);
  }
};

export const entitlementEnd = (user: Record<string, unknown>): number => {
  const time = (value: unknown) => finiteTime(value) ? value : 0;
  return Math.max(time(user.subscriptionEndDate), time(user.visibilityGraceUntil));
};

export const requireCleaner = (user: Record<string, unknown> | undefined): void => {
  if (!user || user.role !== "Cleaner" || user.subscriptionStatus === "refunded" ||
      ["disabled", "deleted", "suspended"].includes(String(user.accountStatus || "").trim().toLowerCase())) {
    fail("permission-denied", "A valid cleaner account is required.");
  }
};

export const requireNewWorkAccess = (user: Record<string, unknown>, now: number): void => {
  if (entitlementEnd(user) <= now) fail("permission-denied", "An active subscription is required to clock in.");
  requireWorkOnboarding(user);
};

export const requireWorkOnboarding = (user: Record<string, unknown>): void => {
  const location = user.serviceLocation as Record<string, unknown> | undefined;
  if (user.instructionsAccepted !== true || Number(user.instructionsVersionAccepted) < REQUIRED_INSTRUCTIONS_VERSION ||
      typeof user.instructionsVersionAccepted !== "number" || !Number.isInteger(user.instructionsVersionAccepted) ||
      !String(user.name || "").trim() || !/^\+1-\d{3}-\d{3}-\d{4}$/.test(String(user.phone || "").trim()) ||
      !location || !String(location.city || "").trim() || !String(location.state || "").trim() ||
      typeof location.latitude !== "number" || !Number.isFinite(location.latitude) ||
      typeof location.longitude !== "number" || !Number.isFinite(location.longitude)) {
    fail("failed-precondition", "Complete the cleaner instructions and required business information first.");
  }
};

export const hasOverlap = (session: WorkSession, start: number, end: number): boolean =>
  session.status !== "discarded" && session.startedAt < end &&
  (session.endedAt ?? session.autoStopAt) > start;

export const sessionResult = (session: WorkSession): WorkSessionResult => ({
  sessionId: session.id, status: session.status, startedAt: session.startedAt,
  endedAt: session.endedAt, durationMs: session.durationMs,
  revision: session.revision ?? 0,
});

export const validateRequest = (raw: unknown): WorkSessionRequest => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("invalid-argument", "Invalid session request.");
  const data = raw as Record<string, unknown>;
  const actions = ["clockIn", "clockOut", "addManual", "confirm", "edit", "discard", "reconcile", "requestReview",
    "setPlannedFinish"];
  if (typeof data.action !== "string" || !actions.includes(data.action) || typeof data.requestId !== "string" ||
      !/^[A-Za-z0-9_-]{8,100}$/.test(data.requestId)) {
    fail("invalid-argument", "A valid action and unique request ID are required.");
  }
  const allowed = ["action", "requestId", "sessionId", "jobId", "reportingTimeZone", "plannedFinishAt",
    "startedAt", "endedAt", "note", "expectedRevision"];
  if (Object.keys(data).some((key) => !allowed.includes(key))) fail("invalid-argument", "Unexpected request field.");
  for (const key of ["sessionId", "jobId"]) {
    if (data[key] !== undefined && data[key] !== null &&
        (typeof data[key] !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(data[key] as string))) {
      fail("invalid-argument", "Invalid session or job identifier.");
    }
  }
  for (const key of ["startedAt", "endedAt", "plannedFinishAt"]) {
    if (data[key] !== undefined && !finiteTime(data[key])) fail("invalid-argument", "Invalid timestamp.");
  }
  if (data.note !== undefined && (typeof data.note !== "string" || data.note.length > 1000)) {
    fail("invalid-argument", "Notes must contain at most 1000 characters.");
  }
  if (data.expectedRevision !== undefined && (!finiteTime(data.expectedRevision) ||
      !["confirm", "edit", "discard", "requestReview"].includes(String(data.action)))) {
    fail("invalid-argument", "A valid record revision is required for this action.");
  }
  const creating = data.action === "clockIn" || data.action === "addManual";
  if (creating) {
    if (typeof data.reportingTimeZone !== "string" || data.reportingTimeZone.length > 80) {
      fail("invalid-argument", "Choose a reporting timezone.");
    }
    try {
      new Intl.DateTimeFormat("en", {timeZone: data.reportingTimeZone as string}).format();
    } catch {
      fail("invalid-argument", "Invalid reporting timezone.");
    }
    if (data.sessionId !== undefined) fail("invalid-argument", "New sessions cannot supply an existing session ID.");
  } else {
    if (!data.sessionId) fail("invalid-argument", "Select a work session.");
    if (data.jobId !== undefined || data.reportingTimeZone !== undefined ||
        (data.plannedFinishAt !== undefined && data.action !== "setPlannedFinish")) {
      fail("invalid-argument", "An existing session's job, timezone and deadlines cannot be changed.");
    }
  }
  if ((data.action === "clockIn" || data.action === "clockOut" || data.action === "discard" ||
      data.action === "reconcile" || data.action === "requestReview" || data.action === "setPlannedFinish") &&
      (data.startedAt !== undefined || data.endedAt !== undefined)) {
    fail("invalid-argument", "Use review or edit to change recorded times.");
  }
  if ((data.action === "addManual" || data.action === "confirm" || data.action === "edit") &&
      (!finiteTime(data.startedAt) || !finiteTime(data.endedAt))) {
    fail("invalid-argument", "Both start and finish times are required.");
  }
  if (data.action === "addManual" && data.plannedFinishAt !== undefined) {
    fail("invalid-argument", "A manual record already has a finish time.");
  }
  if (data.action === "setPlannedFinish" && !finiteTime(data.plannedFinishAt)) {
    fail("invalid-argument", "Choose a planned finish time.");
  }
  return data as unknown as WorkSessionRequest;
};
