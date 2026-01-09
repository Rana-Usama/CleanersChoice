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
    const msIn90Days = 90 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = new Date(now.getTime() - msIn90Days);

    // Convert to Firestore Timestamp
    const ninetyDaysAgoTimestamp =
      admin.firestore.Timestamp.fromDate(ninetyDaysAgo);

    try {
      const expiredJobsSnapshot = await firestore
        .collection("Jobs")
        .where("status", "==", "active")
        .where("createdAt2", "<=", ninetyDaysAgoTimestamp)
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
      console.log(`✅ Deleted ${expiredJobsSnapshot.size} expired jobs`);
    } catch (error) {
      console.error("❌ Error deleting expired jobs:", error);
      throw error;
    }
  }
);
