// functions/src/index.ts
import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

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

/* -------------------------------------------------------------------------
 * Nearby-job notifications
 *
 * When a Customer posts a job, every Cleaner whose saved business location
 * (CleanerServices/{uid}.location) falls within NEARBY_RADIUS_KM of the job's
 * coordinates gets one Notifications record + one push.
 *
 * Cleaners are notified regardless of subscription state — the client decides
 * where the tap lands (NotificationsScreen for active subs, Premium for
 * lapsed ones), see src/utils/notificationNavigation.ts.
 * ---------------------------------------------------------------------- */

const NEARBY_RADIUS_KM = 50;
const EARTH_RADIUS_KM = 6371;

/**
 * How long a synced device position counts as the cleaner's "current"
 * location. Past this it is treated as unavailable and the saved service
 * address is used instead — a cleaner who has not opened the app in a month is
 * likelier to be near their registered service area than their last GPS ping.
 */
const CURRENT_LOCATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Firestore stores coords as numbers, but older docs sometimes hold strings.
 *
 * @param {unknown} value Raw latitude or longitude off a Firestore document.
 * @return {number | null} The coordinate, or null when it is unusable.
 */
function toCoord(value: unknown): number | null {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (typeof n !== "number" || !isFinite(n)) return null;
  return n;
}

/**
 * Great-circle distance in km. Mirrors the `haversine` package the app uses
 * client-side in CleanerJobs.tsx / Home.tsx so server and client agree on who
 * is "within 50 km".
 *
 * @param {number} lat1 Latitude of the first point.
 * @param {number} lon1 Longitude of the first point.
 * @param {number} lat2 Latitude of the second point.
 * @param {number} lon2 Longitude of the second point.
 * @return {number} Distance between the two points, in kilometres.
 */
function distanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Split a list into fixed-size slices, for Firestore batch and FCM multicast
 * limits.
 *
 * @param {Array} items Items to split.
 * @param {number} size Maximum size of each slice.
 * @return {Array} The slices, in order.
 */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

interface CleanerCandidate {
  uid: string;
  token: string | null;
  lat: number | null;
  lng: number | null;
}

export const notifyNearbyCleaners = onDocumentCreated(
  {
    document: "Jobs/{jobId}",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const jobId = event.params.jobId;
    const job = snap.data();
    if (!job) return;

    // Only freshly posted, live jobs.
    if (job.status !== "active") {
      console.log(`notifyNearbyCleaners: ${jobId} not active, skipping`);
      return;
    }

    const jobLat = toCoord(job?.location?.latitude);
    const jobLng = toCoord(job?.location?.longitude);
    if (jobLat === null || jobLng === null) {
      console.log(`notifyNearbyCleaners: ${jobId} has no usable coordinates`);
      return;
    }

    const db = admin.firestore();

    // ---- Idempotency claim -------------------------------------------------
    // Firestore triggers are at-least-once, so claim the job BEFORE sending.
    // A crash after the claim means nobody is notified, which is far better
    // than notifying every nearby cleaner twice.
    let claimed = false;
    try {
      claimed = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(snap.ref);
        if (!fresh.exists) return false;
        if (fresh.get("nearbyNotifiedAt")) return false;
        tx.update(snap.ref, {
          nearbyNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      });
    } catch (error) {
      console.error(`notifyNearbyCleaners: claim failed for ${jobId}`, error);
      return;
    }

    if (!claimed) {
      console.log(`notifyNearbyCleaners: ${jobId} already notified, skipping`);
      return;
    }

    try {
      // NOTE: on the Jobs doc, `jobId` is the POSTING CUSTOMER'S uid, not a
      // job id. Confusing field name, but it is the existing convention.
      const customerId =
        typeof job.jobId === "string" && job.jobId ? job.jobId : null;

      const jobTitle =
        typeof job.title === "string" && job.title.trim() ?
          job.title.trim() :
          "Untitled Job";

      let customerName = "A customer";
      if (customerId) {
        try {
          const customerDoc = await db
            .collection("Users")
            .doc(customerId)
            .get();
          const name = customerDoc.data()?.name;
          if (typeof name === "string" && name.trim()) {
            customerName = name.trim();
          }
        } catch (error) {
          console.error("notifyNearbyCleaners: customer lookup failed", error);
        }
      }

      // ---- Candidate cleaners ---------------------------------------------
      // Deliberately NOT filtered by subscription: lapsed cleaners still get
      // the alert, and the app routes their tap to the Premium paywall.
      const cleanersSnap = await db
        .collection("Users")
        .where("role", "==", "Cleaner")
        .get();

      const candidates: CleanerCandidate[] = [];
      const needsFallbackLocation: string[] = [];

      for (const doc of cleanersSnap.docs) {
        // Never notify the poster (a user could hold both roles).
        if (customerId && doc.id === customerId) continue;

        const user = doc.data() || {};
        const rawToken = user.fcmToken;
        const token =
          typeof rawToken === "string" && rawToken.trim() ?
            rawToken.trim() :
            null;

        // Primary source: the device position the app syncs on each location
        // fetch. This is the same coordinate CleanerJobs.tsx filters the jobs
        // list on, so a cleaner's pushes and their visible jobs agree.
        const lastKnown = user.lastKnownLocation;
        let lat = toCoord(lastKnown?.latitude);
        let lng = toCoord(lastKnown?.longitude);

        // Only a reasonably recent position counts as "current". Records
        // written before updatedAt existed have no age, so they are treated as
        // stale rather than trusted indefinitely.
        if (lat !== null && lng !== null) {
          const updatedAt = lastKnown?.updatedAt;
          const age =
            typeof updatedAt === "number" ?
              Date.now() - updatedAt :
              Number.POSITIVE_INFINITY;

          if (age > CURRENT_LOCATION_MAX_AGE_MS) {
            lat = null;
            lng = null;
          }
        }

        candidates.push({uid: doc.id, token, lat, lng});
        if (lat === null || lng === null) {
          needsFallbackLocation.push(doc.id);
        }
      }

      // Fallback: cleaners who denied location permission, have not opened the
      // app since the sync shipped, or whose position has gone stale still
      // match on their saved service address rather than being excluded.
      // Cleaners with neither source are dropped by the radius filter below.
      if (needsFallbackLocation.length > 0) {
        const byUid = new Map(candidates.map((c) => [c.uid, c]));

        for (const ids of chunk(needsFallbackLocation, 100)) {
          const refs = ids.map((uid) =>
            db.collection("CleanerServices").doc(uid)
          );
          const serviceDocs = await db.getAll(...refs);

          for (const serviceDoc of serviceDocs) {
            if (!serviceDoc.exists) continue;
            const loc = serviceDoc.data()?.location;
            const lat = toCoord(loc?.latitude);
            const lng = toCoord(loc?.longitude);
            if (lat === null || lng === null) continue;

            const candidate = byUid.get(serviceDoc.id);
            if (candidate) {
              candidate.lat = lat;
              candidate.lng = lng;
            }
          }
        }
      }

      // ---- Radius filter ---------------------------------------------------
      const recipients = new Map<string, string | null>();

      for (const candidate of candidates) {
        // No usable coordinate from either source — skip quietly.
        if (candidate.lat === null || candidate.lng === null) continue;

        const distance = distanceInKm(
          jobLat,
          jobLng,
          candidate.lat,
          candidate.lng
        );
        if (distance <= NEARBY_RADIUS_KM) {
          recipients.set(candidate.uid, candidate.token);
        }
      }

      if (recipients.size === 0) {
        await snap.ref.update({nearbyNotifiedCount: 0});
        console.log(`notifyNearbyCleaners: no eligible cleaners for ${jobId}`);
        return;
      }

      const title = "New job near you";
      const body = `${customerName} posted "${jobTitle}" in your area.`;

      // ---- In-app records --------------------------------------------------
      // Written for EVERY nearby cleaner, including those without a token, so
      // a logged-out cleaner still sees the job on their next launch.
      const uids = [...recipients.keys()];
      for (const ids of chunk(uids, 450)) {
        const batch = db.batch();
        for (const uid of ids) {
          batch.set(db.collection("Notifications").doc(), {
            type: "new_nearby_job",
            fromUserId: customerId || "system",
            toUserId: uid,
            jobId,
            title,
            body,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
            jobTitle,
          });
        }
        await batch.commit();
      }

      // ---- Push ------------------------------------------------------------
      const tokenOwners = uids.filter((uid) => !!recipients.get(uid));
      const staleTokenUids: string[] = [];
      let sent = 0;

      for (const owners of chunk(tokenOwners, 500)) {
        const tokens = owners.map((uid) => recipients.get(uid) as string);

        try {
          const response = await admin.messaging().sendEachForMulticast({
            tokens,
            // A `notification` block is required: App.tsx's foreground handler
            // drops data-only messages, and background/quit display relies on
            // the OS rendering this payload.
            notification: {title, body},
            data: {
              screen: "notifications",
              type: "new_nearby_job",
              jobId,
            },
            android: {
              priority: "high",
              notification: {
                channelId: "default",
                sound: "default",
              },
            },
            apns: {
              payload: {aps: {sound: "default"}},
            },
          });

          sent += response.successCount;

          response.responses.forEach((result, index) => {
            if (result.success) return;
            const code = result.error?.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token" ||
              code === "messaging/invalid-argument"
            ) {
              staleTokenUids.push(owners[index]);
            } else {
              console.error(
                `notifyNearbyCleaners: push failed for ${owners[index]}`,
                code
              );
            }
          });
        } catch (error) {
          console.error("notifyNearbyCleaners: multicast failed", error);
        }
      }

      // ---- Prune dead tokens ------------------------------------------------
      if (staleTokenUids.length > 0) {
        for (const ids of chunk(staleTokenUids, 450)) {
          const batch = db.batch();
          for (const uid of ids) {
            batch.update(db.collection("Users").doc(uid), {
              fcmToken: admin.firestore.FieldValue.delete(),
            });
          }
          await batch.commit();
        }
        console.log(
          `notifyNearbyCleaners: cleared ${staleTokenUids.length} stale tokens`
        );
      }

      await snap.ref.update({nearbyNotifiedCount: recipients.size});

      console.log(
        `notifyNearbyCleaners: ${jobId} -> ${recipients.size} cleaners, ` +
          `${sent} pushes delivered`
      );
    } catch (error) {
      // Never rethrow: the job is already posted and every other flow must be
      // unaffected by a notification failure.
      console.error(`notifyNearbyCleaners: failed for ${jobId}`, error);
    }
  }
);
