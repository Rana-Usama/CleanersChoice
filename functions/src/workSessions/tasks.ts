import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentCreated, onDocumentWritten} from "firebase-functions/v2/firestore";
import {reconcileJobWorkSessions, sweepOverdueWorkSessions} from "./recovery";
import {finiteTime} from "./model";
import type {WorkSession} from "./model";
import {reviewNotification} from "./recoveryState";

// Recovery remains enabled even when new clock-ins are disabled.
export const recoverOverdueWorkSessions = onSchedule({
  region: "us-central1", schedule: "0 * * * *", timeZone: "UTC", retryCount: 3,
  memory: "256MiB", timeoutSeconds: 540,
}, async () => {
  const summary = await sweepOverdueWorkSessions(admin.firestore());
  console.log("Work session recovery", summary);
});

export const reconcileJobWorkSessionChanges = onDocumentWritten({
  region: "us-central1", document: "Jobs/{jobId}", retry: true,
  memory: "256MiB", timeoutSeconds: 540,
}, async (event) => {
  if (!event.data) return;
  // Commit/event timestamps are authoritative; client updatedAt is not.
  const occurredAt = event.data.after.exists ? event.data.after.updateTime?.toMillis() : Date.parse(event.time);
  if (!finiteTime(occurredAt)) throw new Error("The job event has no valid commit timestamp.");
  const summary = await reconcileJobWorkSessions(
    admin.firestore(), event.params.jobId, event.data.before.data(), event.data.after.data(), occurredAt, event.id
  );
  if (summary.recovered) console.log("Job interrupted work sessions", {jobId: event.params.jobId, ...summary});
});

// The in-app notice is committed with recovery. Push failure cannot undo hours/state.
export const notifyWorkSessionReview = onDocumentCreated({
  region: "us-central1", document: "Notifications/{notificationId}", retry: true,
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const notification = snapshot.data();
  if (!notification || notification.type !== "work_session_review") return;
  if (typeof notification.workSessionId !== "string" || !/^[a-f0-9]{64}$/.test(notification.workSessionId) ||
      event.params.notificationId !== `work-session-review-${notification.workSessionId}`) return;
  const latest = await snapshot.ref.get();
  if (!latest.exists) return;
  if (latest.data()?.pushDeliveredAt || latest.data()?.pushSkippedAt) return;
  const current = await admin.firestore().collection("WorkSessions").doc(notification.workSessionId).get();
  const session = current.data() as WorkSession | undefined;
  if (!session || session.source !== "clock" || session.cleanerId !== notification.toUserId) return;
  if (session.status !== "needsReview") {
    await snapshot.ref.update({
      pushSkippedAt: admin.firestore.FieldValue.serverTimestamp(), pushSkipReason: "already-resolved",
    });
    return;
  }
  // Use the server-owned session for destination/content, never a client-written notice.
  const notice = reviewNotification(session, Date.now());
  const user = await admin.firestore().collection("Users").doc(session.cleanerId).get();
  const token = user.data()?.fcmToken;
  if (!token) {
    await snapshot.ref.update({
      pushSkippedAt: admin.firestore.FieldValue.serverTimestamp(), pushSkipReason: "no-token",
    });
    return;
  }
  try {
    await admin.messaging().send({
      token, notification: {title: notice.title, body: notice.body},
      data: {screen: "notifications", type: "work_session_review", workSessionId: notification.workSessionId},
      android: {priority: "high"}, apns: {payload: {aps: {sound: "default"}}},
    });
  } catch (error) {
    const code = (error as {code?: string}).code;
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
      await snapshot.ref.update({
        pushSkippedAt: admin.firestore.FieldValue.serverTimestamp(), pushSkipReason: "invalid-token",
      });
      return;
    }
    throw error;
  }
  await snapshot.ref.update({pushDeliveredAt: admin.firestore.FieldValue.serverTimestamp()});
});
