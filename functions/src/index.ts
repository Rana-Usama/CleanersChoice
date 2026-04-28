// functions/src/index.ts
import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";

admin.initializeApp();

// Runs daily at midnight
export const autoDeleteExpiredJobs = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "America/New_York",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const firestore = admin.firestore();
    const now = new Date();
    const msIn30Days = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(now.getTime() - msIn30Days);

    // Convert to Firestore Timestamp
    const thirtyDaysAgoTimestamp =
      admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    try {
      const expiredJobsSnapshot = await firestore
        .collection("Jobs")
        .where("status", "==", "active")
        .where("createdAt2", "<=", thirtyDaysAgoTimestamp)
        .get();

      if (expiredJobsSnapshot.empty) {
        console.log("No expired jobs found");
        return;
      }

      const batch = firestore.batch();
      expiredJobsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(` Deleted ${expiredJobsSnapshot.size} expired jobs`);
    } catch (error) {
      console.error(" Error deleting expired jobs:", error);
      throw error;
    }
  }
);

// Runs every hour — auto-completes confirmed/pending_completion jobs
// 72 hours after their scheduled date
export const autoCompleteJobs = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const msIn72Hours = 72 * 60 * 60 * 1000;

    try {
      // Query confirmed and pending_completion jobs
      const [confirmedSnap, pendingSnap] = await Promise.all([
        db.collection("Jobs").where("status", "==", "confirmed").get(),
        db.collection("Jobs").where("status", "==", "pending_completion").get(),
      ]);

      const allDocs = [...confirmedSnap.docs, ...pendingSnap.docs];

      if (allDocs.length === 0) {
        console.log("No jobs to auto-complete");
        return;
      }

      const batch = db.batch();
      let count = 0;
      const notificationPromises: Promise<void>[] = [];

      for (const doc of allDocs) {
        const data = doc.data();
        const scheduledDate = data.createdAt; // string 'YYYY-MM-DD HH:mm A'

        if (!scheduledDate) continue;

        // Parse the scheduled date string
        const parsedDate = parseScheduledDate(scheduledDate);
        if (!parsedDate) continue;

        const elapsed = now.getTime() - parsedDate.getTime();
        if (elapsed < msIn72Hours) continue;

        // Auto-complete this job
        batch.update(doc.ref, {
          status: "completed",
          autoCompleted: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;

        // Queue notifications for both customer and cleaner
        const jobId = doc.id;
        const ownerId = data.jobId;
        const cleanerId = data.confirmedCleaner;
        const jobTitle = data.title || "Untitled Job";

        if (ownerId) {
          notificationPromises.push(
            sendAutoCompleteNotification(
              db, jobId, jobTitle, ownerId, "auto_complete"
            )
          );
        }
        if (cleanerId) {
          notificationPromises.push(
            sendAutoCompleteNotification(
              db, jobId, jobTitle, cleanerId, "auto_complete"
            )
          );
        }
      }

      if (count > 0) {
        await batch.commit();
        await Promise.allSettled(notificationPromises);
        console.log(` Auto-completed ${count} jobs`);
      } else {
        console.log("No jobs past 72hr threshold");
      }
    } catch (error) {
      console.error(" Error auto-completing jobs:", error);
      throw error;
    }
  }
);

// Parse 'YYYY-MM-DD HH:mm A' or 'YYYY-MM-DD  HH:mm A' format
function parseScheduledDate(dateStr: string): Date | null {
  try {
    // Normalize double spaces
    const normalized = dateStr.replace(/\s+/g, " ").trim();
    // Expected: "2025-03-15 02:30 PM"
    const match = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i
    );
    if (!match) return null;

    const [, year, month, day, hourStr, minute, ampm] = match;
    let hour = parseInt(hourStr, 10);
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;

    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hour,
      parseInt(minute, 10)
    );
  } catch {
    return null;
  }
}

async function sendAutoCompleteNotification(
  db: admin.firestore.Firestore,
  jobId: string,
  jobTitle: string,
  toUserId: string,
  type: string
): Promise<void> {
  try {
    const userDoc = await db.collection("Users").doc(toUserId).get();
    const userData = userDoc.data();

    // Store in Firestore
    await db.collection("Notifications").add({
      type,
      fromUserId: "system",
      toUserId,
      jobId,
      title: "Job Auto-Completed",
      body: `"${jobTitle}" has been automatically completed (72hrs past scheduled date)`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      jobTitle,
    });

    // Send push notification
    if (userData?.fcmToken) {
      const message: admin.messaging.Message = {
        token: userData.fcmToken,
        notification: {
          title: "Job Auto-Completed",
          body: `"${jobTitle}" has been automatically completed`,
        },
        data: {screen: "notifications"},
      };
      await admin.messaging().send(message);
    }
  } catch (error) {
    console.error(`Error sending auto-complete notification to ${toUserId}:`,
      error);
  }
}

// Runs every hour — handles job expiry scenarios
// Scenario A: No applicants after scheduled time → "expired"
// Scenario B: Applicants but no confirmation → "unconfirmed"
export const handleJobExpiry = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const msIn3Hours = 3 * 60 * 60 * 1000;
    const msIn2Point5Hours = 2.5 * 60 * 60 * 1000;

    try {
      const batch = db.batch();
      let updateCount = 0;
      const notificationPromises: Promise<void>[] = [];

      // Part 1: Process active jobs (pre-expiry warning + status change)
      const activeSnap = await db
        .collection("Jobs")
        .where("status", "==", "active")
        .get();

      for (const doc of activeSnap.docs) {
        const data = doc.data();
        const scheduledDate = data.createdAt;
        if (!scheduledDate) continue;

        const parsedDate = parseScheduledDate(scheduledDate);
        if (!parsedDate) continue;

        const timeUntilScheduled = parsedDate.getTime() - now.getTime();
        const timeSinceScheduled = now.getTime() - parsedDate.getTime();
        const applicants: string[] = data.applicants || [];
        const confirmedCleaner = data.confirmedCleaner;
        const ownerId = data.jobId;
        const jobTitle = data.title || "Untitled Job";

        // Skip jobs with a confirmed cleaner (handled by autoCompleteJobs)
        if (confirmedCleaner) continue;

        // Scenario B pre-warning: 3 hours before scheduled time
        if (
          timeUntilScheduled > 0 &&
          timeUntilScheduled <= msIn3Hours &&
          applicants.length > 0 &&
          !data.expiryWarningNotified
        ) {
          batch.update(doc.ref, {expiryWarningNotified: true});
          updateCount++;
          if (ownerId) {
            notificationPromises.push(
              sendExpiryNotification(
                db,
                doc.id,
                jobTitle,
                ownerId,
                "expiry_warning",
                "Confirm Your Applicants",
                `Your job "${jobTitle}" is expiring soon. You have ${
                  applicants.length
                } applicant${
                  applicants.length !== 1 ? "s" : ""
                } but haven't confirmed anyone. Please confirm before the job expires.`
              )
            );
          }
          continue;
        }

        // Job has not yet reached scheduled time
        if (timeSinceScheduled <= 0) continue;

        // Scenario A: No applicants — mark as expired
        if (applicants.length === 0) {
          batch.update(doc.ref, {
            status: "expired",
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
        }
        // Scenario B: Applicants but no confirmation — mark as unconfirmed
        else {
          batch.update(doc.ref, {
            status: "unconfirmed",
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
          if (ownerId) {
            notificationPromises.push(
              sendExpiryNotification(
                db,
                doc.id,
                jobTitle,
                ownerId,
                "unconfirmed",
                "Job Expired \u2014 Unconfirmed",
                `Your job "${jobTitle}" has expired. You had ${
                  applicants.length
                } applicant${
                  applicants.length !== 1 ? "s" : ""
                } but didn't confirm anyone.`
              )
            );
          }
        }
      }

      // Part 2: Send repost notification for expired jobs (2h after expiry)
      const expiredSnap = await db
        .collection("Jobs")
        .where("status", "==", "expired")
        .get();

      for (const doc of expiredSnap.docs) {
        const data = doc.data();
        if (data.repostNotificationSent) continue;

        const scheduledDate = data.createdAt;
        if (!scheduledDate) continue;
        const parsedDate = parseScheduledDate(scheduledDate);
        if (!parsedDate) continue;

        const timeSinceScheduled = now.getTime() - parsedDate.getTime();
        if (timeSinceScheduled < msIn2Point5Hours) continue;

        batch.update(doc.ref, {repostNotificationSent: true});
        updateCount++;

        const ownerId = data.jobId;
        const jobTitle = data.title || "Untitled Job";

        if (ownerId) {
          notificationPromises.push(
            sendExpiryNotification(
              db,
              doc.id,
              jobTitle,
              ownerId,
              "expired",
              "Job Expired",
              `Your job "${jobTitle}" has expired. No cleaners applied. Would you like to repost it?`
            )
          );
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        await Promise.allSettled(notificationPromises);
        console.log(`Job expiry: processed ${updateCount} updates`);
      } else {
        console.log("Job expiry: no updates needed");
      }
    } catch (error) {
      console.error("Error handling job expiry:", error);
      throw error;
    }
  }
);

async function sendExpiryNotification(
  db: admin.firestore.Firestore,
  jobId: string,
  jobTitle: string,
  toUserId: string,
  type: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const userDoc = await db.collection("Users").doc(toUserId).get();
    const userData = userDoc.data();

    await db.collection("Notifications").add({
      type,
      fromUserId: "system",
      toUserId,
      jobId,
      title,
      body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      jobTitle,
    });

    if (userData?.fcmToken) {
      const message: admin.messaging.Message = {
        token: userData.fcmToken,
        notification: {title, body},
        data: {screen: "notifications"},
      };
      await admin.messaging().send(message);
    }
  } catch (error) {
    console.error(
      `Error sending expiry notification to ${toUserId}:`,
      error
    );
  }
}
