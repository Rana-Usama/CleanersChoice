import * as admin from "firebase-admin";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {addedJobApplicants, storeApplicationNotification} from "./applicationNotifications";

export const notifyJobApplications = onDocumentUpdated({
  region: "us-central1", document: "Jobs/{jobId}", retry: true,
}, async (event) => {
  if (!event.data) return;
  const added = addedJobApplicants(event.data.before.data(), event.data.after.data());
  if (!added.length) return;
  const occurredAt = event.data.after.updateTime?.toMillis();
  if (occurredAt === undefined) throw new Error("The application event has no commit timestamp.");
  const db = admin.firestore();
  const notice = await storeApplicationNotification(
    db, event.params.jobId, added, occurredAt, admin.firestore.FieldValue.serverTimestamp()
  );
  if (!notice) return;
  // The inbox record is durable even when push delivery fails or no token exists.
  try {
    const customer = await db.collection("Users").doc(notice.toUserId).get();
    const token = customer.data()?.fcmToken;
    if (typeof token === "string" && token) {
      await admin.messaging().send({token, notification: {title: notice.title, body: notice.body},
        data: {screen: "notifications"}});
    }
  } catch (error) {
    console.warn("Job application saved; push delivery failed", {jobId: event.params.jobId, error});
  }
});
