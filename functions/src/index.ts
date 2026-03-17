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
// 48 hours after their scheduled date
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
    const msIn48Hours = 48 * 60 * 60 * 1000;

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
        if (elapsed < msIn48Hours) continue;

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
        console.log("No jobs past 48hr threshold");
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
      body: `"${jobTitle}" has been automatically completed (48hrs past scheduled date)`,
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
