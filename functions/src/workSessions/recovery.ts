import {createHash} from "node:crypto";
import type {Firestore} from "firebase-admin/firestore";
import type {WorkSession} from "./model";
import {jobChangeReason, planSessionRecovery, RecoveryTrigger, reviewNotification} from "./recoveryState";

// Same lock and audit schema as human operations; repeat delivery is a no-op.
export const recoverWorkSession = async (
  db: Firestore, sessionId: string, trigger: RecoveryTrigger, clock: () => number = Date.now
): Promise<boolean> => db.runTransaction(async (tx) => {
  const ref = db.collection("WorkSessions").doc(sessionId);
  const snapshot = await tx.get(ref);
  if (!snapshot.exists) return false;
  const current = snapshot.data() as WorkSession;
  const lockRef = db.collection("WorkSessionLocks").doc(current.cleanerId);
  const lockSnap = await tx.get(lockRef);
  const lock = lockSnap.data() || {};
  const now = clock();
  const plan = planSessionRecovery(current, trigger, now);
  if (!plan) return false;
  const historyId = "recovery_" + createHash("sha256").update(trigger.eventId).digest("hex");
  const reviews = Array.isArray(lock?.reviewSessionIds) ? lock.reviewSessionIds as string[] : [];
  tx.set(ref, plan.session);
  tx.set(ref.collection("history").doc(historyId), plan.audit);
  tx.set(lockRef, {
    cleanerId: current.cleanerId, activeSessionId: lock?.activeSessionId || current.id,
    reviewSessionIds: [...new Set([...reviews, current.id])], revision: (lock?.revision || 0) + 1, updatedAt: now,
  });
  if (current.status !== "needsReview") {
    tx.set(db.collection("Notifications").doc(`work-session-review-${current.id}`),
      reviewNotification(plan.session, now));
  }
  return true;
});

export interface RecoverySummary {examined: number; recovered: number}

export const sweepOverdueWorkSessions = async (
  db: Firestore, clock: () => number = Date.now, pageSize = 200
): Promise<RecoverySummary> => {
  const cutoff = clock();
  const query = db.collection("WorkSessions").where("status", "==", "active")
    .where("autoStopAt", "<=", cutoff).orderBy("autoStopAt").limit(pageSize);
  const summary: RecoverySummary = {examined: 0, recovered: 0};
  let page = await query.get();
  while (!page.empty) {
    const results = await Promise.allSettled(page.docs.map((doc) => recoverWorkSession(db, doc.id, {
      reason: "deadline", occurredAt: (doc.data() as WorkSession).autoStopAt,
      eventId: `deadline:${doc.id}:${doc.data().autoStopAt}`,
    }, clock)));
    summary.examined += page.size;
    summary.recovered += results.filter((result) => result.status === "fulfilled" && result.value).length;
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    page = await query.startAfter(page.docs[page.docs.length - 1]).get();
  }
  return summary;
};

export const reconcileJobWorkSessions = async (
  db: Firestore, jobId: string, before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined, occurredAt: number, eventId: string,
  clock: () => number = Date.now, pageSize = 200
): Promise<RecoverySummary> => {
  const reason = jobChangeReason(before, after);
  const summary: RecoverySummary = {examined: 0, recovered: 0};
  if (!reason) return summary;
  const query = db.collection("WorkSessions").where("jobId", "==", jobId)
    .where("status", "in", ["active", "needsReview", "confirmed"])
    .where("startedAt", "<=", occurredAt).orderBy("startedAt").limit(pageSize);
  let page = await query.get();
  while (!page.empty) {
    const results = await Promise.allSettled(page.docs.map((doc) => recoverWorkSession(db, doc.id, {
      reason, occurredAt, eventId, jobId,
    }, clock)));
    summary.examined += page.size;
    summary.recovered += results.filter((result) => result.status === "fulfilled" && result.value).length;
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    page = await query.startAfter(page.docs[page.docs.length - 1]).get();
  }
  return summary;
};
