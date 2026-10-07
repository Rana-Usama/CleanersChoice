import {finiteTime, WorkSession, WorkSessionAudit} from "./model";

export interface RecoveryTrigger {
  reason: string;
  occurredAt: number;
  eventId: string;
  jobId?: string;
}

export const jobStopReason = (
  job: Record<string, unknown> | undefined, cleanerId: string
): string | null => {
  if (!job) return "jobDeleted";
  if (job.status === "completed") return "jobCompleted";
  if (job.status === "pending_completion") return "jobCompletionRequested";
  if (job.confirmedCleaner !== cleanerId) return job.confirmedCleaner ? "jobReassigned" : "jobAssignmentRemoved";
  return job.status === "confirmed" ? null : "jobInterrupted";
};

export const jobChangeReason = (
  before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined
): string | null => {
  if (!before) return null;
  if (!after) return "jobDeleted";
  if (after.confirmedCleaner !== before.confirmedCleaner) {
    return after.confirmedCleaner ? "jobReassigned" : "jobAssignmentRemoved";
  }
  // A rejection/reopening restores eligibility; it never revives an old timer.
  if (after.status !== before.status && after.status !== "confirmed") {
    return after.status === "completed" ? "jobCompleted" :
      after.status === "pending_completion" ? "jobCompletionRequested" : "jobInterrupted";
  }
  return null;
};

export const planSessionRecovery = (
  current: WorkSession, trigger: RecoveryTrigger, detectedAt: number
): {session: WorkSession; audit: WorkSessionAudit} | null => {
  if (current.source !== "clock" || current.status === "discarded" ||
      !finiteTime(trigger.occurredAt) || !finiteTime(current.autoStopAt) ||
      (trigger.jobId !== undefined && current.jobId !== trigger.jobId)) return null;
  if (trigger.reason === "deadline") {
    if (current.status !== "active" || current.autoStopAt > detectedAt) return null;
  } else {
    // A delayed event from an earlier shift cannot stop a later session.
    if (trigger.occurredAt < current.startedAt || trigger.occurredAt > detectedAt) return null;
    const latest = current.editHistory[current.editHistory.length - 1];
    if (current.status === "confirmed" && latest?.action !== "clockOut") return null;
  }
  const endedAt = Math.max(current.startedAt, Math.min(trigger.occurredAt, current.autoStopAt, detectedAt));
  if (current.status !== "active" && (current.endedAt === null || current.endedAt <= endedAt)) return null;
  const reason = current.autoStopAt < trigger.occurredAt ? "deadline" : trigger.reason;
  const session: WorkSession = {
    ...current, status: "needsReview", endedAt, durationMs: 0,
    estimatedDurationMs: endedAt - current.startedAt, stopReason: reason, updatedAt: detectedAt,
    revision: (current.revision ?? 0) + 1,
  };
  const audit: WorkSessionAudit = {
    action: "autoStopped", actorId: "system", at: detectedAt, stopReason: reason, eventId: trigger.eventId,
    before: {startedAt: current.startedAt, endedAt: current.endedAt, status: current.status},
    after: {startedAt: session.startedAt, endedAt: session.endedAt, status: session.status}, note: "",
  };
  session.editHistory = [...current.editHistory, audit].slice(-20);
  return {session, audit};
};

export const reviewNotification = (session: WorkSession, detectedAt: number) => ({
  type: "work_session_review", fromUserId: "system", toUserId: session.cleanerId,
  jobId: session.jobId || "", workSessionId: session.id,
  jobTitle: session.jobSnapshot?.title || "General work",
  title: "Work session needs review",
  body: "A work timer was stopped. Confirm when you finished so your hours can count.",
  timestamp: new Date(detectedAt), read: false,
});
