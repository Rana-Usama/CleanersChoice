import {createHash} from "node:crypto";
import type {Firestore, Transaction} from "firebase-admin/firestore";
import {
  entitlementEnd, fail, finiteTime, hasOverlap, HOUR_MS, parseWorkSessionConfig,
  requireCleaner, requireNewWorkAccess, requireWorkOnboarding, sessionResult, validateInterval, validateRequest,
  WorkSession, WorkSessionAudit, WorkSessionRequest, WorkSessionResult,
} from "./model";
import {jobStopReason, planSessionRecovery, reviewNotification} from "./recoveryState";

const positiveRate = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

const snapshotMillis = (value: unknown): number | null => {
  const timestamp = value as {toMillis?: () => number} | null;
  const millis = timestamp && typeof timestamp.toMillis === "function" ? timestamp.toMillis() : null;
  return finiteTime(millis) ? millis : null;
};

const requestHash = (request: WorkSessionRequest): string => createHash("sha256").update(JSON.stringify({
  action: request.action, sessionId: request.sessionId ?? null, jobId: request.jobId ?? null,
  reportingTimeZone: request.reportingTimeZone ?? null, plannedFinishAt: request.plannedFinishAt ?? null,
  startedAt: request.startedAt ?? null, endedAt: request.endedAt ?? null, note: request.note ?? "",
  ...(request.expectedRevision !== undefined ? {expectedRevision: request.expectedRevision} : {}),
})).digest("hex");

const checkOverlap = async (
  db: Firestore, tx: Transaction, uid: string, start: number, end: number, excludingId?: string
): Promise<void> => {
  // Every stored interval is at most 12h, so older records cannot overlap.
  const query = db.collection("WorkSessions").where("cleanerId", "==", uid)
    .where("status", "in", ["active", "needsReview", "confirmed"])
    .where("startedAt", ">=", Math.max(0, start - 12 * HOUR_MS)).where("startedAt", "<", end);
  const snapshot = await tx.get(query);
  if (snapshot.docs.some((doc) => doc.id !== excludingId && hasOverlap(doc.data() as WorkSession, start, end))) {
    fail("already-exists", "These times overlap another work session. Adjust them or edit that session.");
  }
};

const makeSession = (
  id: string, uid: string, request: WorkSessionRequest, user: Record<string, unknown>,
  job: Record<string, unknown> | undefined, config: WorkSession["timingConfig"], now: number
): WorkSession => {
  const manual = request.action === "addManual";
  const startedAt = manual ? request.startedAt as number : now;
  const endedAt = manual ? request.endedAt as number : null;
  const scheduledStart = snapshotMillis(job?.scheduledStartAt);
  const hours = job?.expectedHours;
  const expectedHours = typeof hours === "number" && Number.isFinite(hours) && hours > 0 && hours <= 12 ? hours : null;
  if (!manual && job && (expectedHours === null || scheduledStart === null)) {
    fail("failed-precondition", "This job needs an expected duration and saved schedule before clock-in.");
  }
  let expectedEndAt = scheduledStart !== null && expectedHours !== null ?
    scheduledStart + expectedHours * HOUR_MS : null;
  const capAt = startedAt + config.hardCapHours * HOUR_MS;
  if (request.plannedFinishAt !== undefined) {
    if (job && expectedEndAt !== null && expectedEndAt + config.graceHours * HOUR_MS > now) {
      fail("invalid-argument", "The job's expected end is already defined.");
    }
    if (request.plannedFinishAt <= startedAt || request.plannedFinishAt > capAt) {
      fail("invalid-argument", "Planned finish must be after clock-in and within the hard cap.");
    }
    expectedEndAt = request.plannedFinishAt;
  }
  if (!manual && expectedEndAt !== null && expectedEndAt + config.graceHours * HOUR_MS <= now) {
    fail("failed-precondition", "The expected finish has passed. Supply a revised planned finish for this session.");
  }
  const autoStopAt = manual ? endedAt as number : Math.min(capAt,
    expectedEndAt === null ? capAt : expectedEndAt + config.graceHours * HOUR_MS);
  const basis = !job ? "general" : job.budgetType === "hourly" ? "hourly" : job.budgetType === "sqft" ? "sqft" : "flat";
  const jobRate = basis === "hourly" ? positiveRate(job?.hourlyRate) : null;
  const fallback = basis === "hourly" || basis === "general" ? positiveRate(user.defaultHourlyRate) : null;
  return {
    id, cleanerId: uid, jobId: request.jobId || null,
    jobSnapshot: job ? {
      title: String(job.title || "Job"), customerId: typeof job.jobId === "string" ? job.jobId : null,
      scheduledStartAt: scheduledStart, expectedHours,
      scheduleTimeZone: typeof job.scheduleTimeZone === "string" ? job.scheduleTimeZone : null,
    } : null,
    paySnapshot: {basis, hourlyRate: jobRate ?? fallback,
      rateSource: jobRate !== null ? "job" : fallback !== null ? "cleanerDefault" : "unavailable", capturedAt: now},
    reportingTimeZone: request.reportingTimeZone as string, source: manual ? "manualCleaner" : "clock",
    status: manual ? "needsReview" : "active", startedAt, endedAt, expectedEndAt, autoStopAt,
    timingConfig: config, durationMs: 0, estimatedDurationMs: manual ? (endedAt as number) - startedAt : 0,
    stopReason: null, note: request.note || "", editHistory: [], createdAt: now, updatedAt: now,
    revision: 1,
  };
};

// Every mutation takes the cleaner lock, including edits and manual entries.
export const executeWorkSessionOperation = async (
  db: Firestore, uid: string, raw: unknown, clock: () => number = Date.now
): Promise<WorkSessionResult> => {
  const request = validateRequest(raw);
  const hash = requestHash(request);
  const receiptRef = db.collection("WorkSessionOperations").doc(uid).collection("requests").doc(request.requestId);
  const lockRef = db.collection("WorkSessionLocks").doc(uid);
  const creating = request.action === "clockIn" || request.action === "addManual";
  const sessionId = creating ? createHash("sha256").update(`${uid}:${request.requestId}`).digest("hex") :
    request.sessionId as string;
  const ref = db.collection("WorkSessions").doc(sessionId);
  return db.runTransaction(async (tx) => {
    const now = clock();
    const userSnap = await tx.get(db.collection("Users").doc(uid));
    const user = userSnap.data();
    requireCleaner(user);
    const receipt = await tx.get(receiptRef);
    if (receipt.exists) {
      if (receipt.data()?.requestHash !== hash) {
        fail("already-exists", "This request ID was used for a different action.");
      }
      return receipt.data()?.result as WorkSessionResult;
    }
    const lockSnap = await tx.get(lockRef);
    const lock = lockSnap.data() || {};
    let activeSessionId: string | null = lock?.activeSessionId || null;
    let reviewSessionIds: string[] = Array.isArray(lock?.reviewSessionIds) ? [...lock.reviewSessionIds] : [];
    const snapshot = await tx.get(ref);
    if (!creating && (!snapshot.exists || snapshot.data()?.cleanerId !== uid)) {
      fail("permission-denied", "This work session is not available to your account.");
    }
    if (creating && snapshot.exists) fail("already-exists", "This session already exists.");
    let session: WorkSession;
    const event = request.action as string;
    let recoveryAudit: WorkSessionAudit | undefined;
    const before = creating ? null : snapshot.data() as WorkSession;
    if (before && request.expectedRevision !== undefined && request.expectedRevision !== (before.revision ?? 0)) {
      fail("failed-precondition", "This record changed while you were editing. Close the form and reload it.");
    }
    if (creating) {
      const configSnap = await tx.get(db.collection("AppConfig").doc("workSessions"));
      const config = parseWorkSessionConfig(configSnap.data());
      if (!config.enabled) fail("failed-precondition", "New work records are currently disabled.");
      if (request.action === "clockIn") {
        requireNewWorkAccess(user as Record<string, unknown>, now);
        if (activeSessionId || reviewSessionIds.length) {
          fail("failed-precondition", "Finish or review your existing sessions before clocking in.");
        }
      } else {
        requireWorkOnboarding(user as Record<string, unknown>);
        validateInterval(request.startedAt, request.endedAt, now, config.hardCapHours);
        if (now - (request.startedAt as number) > config.manualEntryMaxAgeDays * 24 * HOUR_MS) {
          fail("invalid-argument", "Manual work must start within the allowed recent-entry window.");
        }
        if (entitlementEnd(user as Record<string, unknown>) < (request.endedAt as number)) {
          fail("permission-denied", "Manual work must finish within your recorded subscription access period.");
        }
      }
      let job: Record<string, unknown> | undefined;
      if (request.jobId) {
        const jobSnap = await tx.get(db.collection("Jobs").doc(request.jobId));
        job = jobSnap.data();
        if (!job || job.confirmedCleaner !== uid || (request.action === "clockIn" && job.status !== "confirmed")) {
          fail("permission-denied", "You are not assigned to an eligible job. Record general work instead.");
        }
      }
      session = makeSession(sessionId, uid, request, user as Record<string, unknown>, job, config, now);
      await checkOverlap(db, tx, uid, session.startedAt, session.endedAt ?? session.autoStopAt);
      if (request.action === "clockIn") activeSessionId = session.id;
    } else {
      session = {...before as WorkSession};
      if (request.action === "clockOut" || request.action === "reconcile") {
        if (session.status === "discarded" && request.action === "clockOut") {
          fail("failed-precondition", "This session was discarded.");
        }
        if (session.status === "active") {
          if (activeSessionId !== session.id) fail("failed-precondition", "Your active session needs reconciliation.");
          let stopReason: string | null = null;
          let interruptedAt = now;
          if (session.jobId) {
            const currentJob = await tx.get(db.collection("Jobs").doc(session.jobId));
            stopReason = jobStopReason(currentJob.data(), uid);
            interruptedAt = Math.max(session.startedAt, Math.min(now, currentJob.updateTime?.toMillis() ?? now));
          }
          const plan = stopReason || now >= session.autoStopAt ? planSessionRecovery(session, {
            reason: stopReason || "deadline", occurredAt: stopReason ? interruptedAt : session.autoStopAt,
            eventId: `operation:${request.requestId}`,
          }, now) : null;
          if (plan) {
            session = plan.session;
            recoveryAudit = plan.audit;
            reviewSessionIds = [...new Set([...reviewSessionIds, session.id])];
          } else if (request.action === "reconcile") {
            // Automatic reconciliation never treats still-active time as confirmed.
            const result = sessionResult(session);
            tx.set(receiptRef, {cleanerId: uid, requestHash: hash, result, createdAt: now});
            return result;
          } else {
            validateInterval(session.startedAt, now, now, session.timingConfig.hardCapHours);
            await checkOverlap(db, tx, uid, session.startedAt, now, session.id);
            session.status = "confirmed";
            session.endedAt = now;
            session.durationMs = now - session.startedAt;
            activeSessionId = null;
          }
        } else {
          // A second clock-out is a harmless retry, including another device.
          const result = sessionResult(session);
          tx.set(receiptRef, {cleanerId: uid, requestHash: hash, result, createdAt: now});
          return result;
        }
      } else if (request.action === "setPlannedFinish") {
        if (session.status !== "active" || session.jobId || session.expectedEndAt !== null ||
            activeSessionId !== session.id || now >= session.autoStopAt) {
          fail("failed-precondition", "A planned finish can only be added to running general work.");
        }
        const planned = request.plannedFinishAt as number;
        if (planned <= now || planned > session.autoStopAt) {
          fail("invalid-argument", "Choose a future finish within this session's hard cap.");
        }
        session.expectedEndAt = planned;
        session.autoStopAt = Math.min(session.autoStopAt, planned + session.timingConfig.graceHours * HOUR_MS);
      } else if (request.action === "requestReview") {
        if (session.status !== "active") {
          const result = sessionResult(session);
          tx.set(receiptRef, {cleanerId: uid, requestHash: hash, result, createdAt: now});
          return result;
        }
        if (activeSessionId !== session.id) fail("failed-precondition", "Your active session needs reconciliation.");
        session.status = "needsReview";
        session.endedAt = Math.min(now, session.autoStopAt);
        session.durationMs = 0;
        session.estimatedDurationMs = session.endedAt - session.startedAt;
        session.stopReason = "cleanerReviewRequested";
        reviewSessionIds = [...new Set([...reviewSessionIds, session.id])];
      } else if (request.action === "discard") {
        if (session.status === "discarded") {
          const result = sessionResult(session);
          tx.set(receiptRef, {cleanerId: uid, requestHash: hash, result, createdAt: now});
          return result;
        }
        session.status = "discarded";
        session.endedAt = session.endedAt ?? Math.min(now, session.autoStopAt);
        session.durationMs = 0;
        session.estimatedDurationMs = 0;
        if (activeSessionId === session.id) activeSessionId = null;
        reviewSessionIds = reviewSessionIds.filter((id) => id !== session.id);
      } else {
        const desired = request.action === "confirm" ? "needsReview" : "confirmed";
        if (session.status !== desired) {
          fail("failed-precondition", "This session cannot be confirmed or edited in its state.");
        }
        validateInterval(request.startedAt, request.endedAt, now, session.timingConfig.hardCapHours);
        if (session.source === "manualCleaner" &&
            entitlementEnd(user as Record<string, unknown>) < (request.endedAt as number)) {
          fail("permission-denied", "Manual work must finish within your recorded subscription access period.");
        }
        await checkOverlap(db, tx, uid, request.startedAt as number, request.endedAt as number, session.id);
        session.startedAt = request.startedAt as number;
        session.endedAt = request.endedAt as number;
        session.status = "confirmed";
        session.durationMs = session.endedAt - session.startedAt;
        session.estimatedDurationMs = 0;
        if (activeSessionId === session.id) activeSessionId = null;
        reviewSessionIds = reviewSessionIds.filter((id) => id !== session.id);
      }
    }
    const audit: WorkSessionAudit = recoveryAudit || {
      action: event, actorId: event === "autoStopped" ? "system" : uid, at: now,
      before: before ? {startedAt: before.startedAt, endedAt: before.endedAt, status: before.status} : null,
      after: {startedAt: session.startedAt, endedAt: session.endedAt, status: session.status}, note: request.note || "",
    };
    if (!recoveryAudit) session.editHistory = [...session.editHistory, audit].slice(-20);
    session.updatedAt = now;
    session.revision = (before?.revision ?? 0) + 1;
    session.note = request.note ?? session.note;
    const result = sessionResult(session);
    tx.set(ref, session);
    tx.set(ref.collection("history").doc(request.requestId), audit);
    tx.set(lockRef, {
      cleanerId: uid, activeSessionId, reviewSessionIds, revision: (lock?.revision || 0) + 1, updatedAt: now,
    });
    if (recoveryAudit) {
      tx.set(db.collection("Notifications").doc(`work-session-review-${session.id}`), reviewNotification(session, now));
    }
    tx.set(receiptRef, {cleanerId: uid, requestHash: hash, result, createdAt: now});
    return result;
  });
};
