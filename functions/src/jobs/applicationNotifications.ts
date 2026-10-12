import type {Firestore} from "firebase-admin/firestore";

const applicants = (job: Record<string, unknown> | undefined): string[] => {
  const values = job?.applicants;
  return Array.isArray(values) ? [...new Set(values.filter(
    (uid): uid is string => typeof uid === "string" && !!uid
  ))] : [];
};

export const addedJobApplicants = (
  before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined
): string[] => {
  const previous = new Set(applicants(before));
  return applicants(after).filter((uid) => !previous.has(uid));
};

export interface ApplicationNotice {
  toUserId: string;
  title: string;
  body: string;
}

// Client application writes cannot read the customer's private notification inbox.
export const storeApplicationNotification = async (
  db: Firestore, jobId: string, added: string[], occurredAt: number, timestamp: unknown
): Promise<ApplicationNotice | null> => {
  if (!added.length) return null;
  return db.runTransaction(async (tx) => {
    const current = await tx.get(db.collection("Jobs").doc(jobId));
    const job = current.data();
    const owner = job?.jobId;
    const currentApplicants = applicants(job);
    const latestApplicant = added.find((uid) => currentApplicants.includes(uid));
    if (!current.exists || typeof owner !== "string" || !owner || !latestApplicant) return null;

    // Reuse the legacy grouped notice. A single-field query requires no composite index.
    const existing = await tx.get(db.collection("Notifications").where("jobId", "==", jobId));
    const notices = existing.docs.filter((doc) =>
      doc.data().type === "application" && doc.data().toUserId === owner
    ).sort((a, b) => a.id.localeCompare(b.id));
    const saved = notices[0];
    // Read the live job inside the transaction: overlapping/out-of-order events
    // publish its actual count once, rather than incrementing a stale notice.
    const version = current.updateTime?.toMillis() ?? occurredAt;
    if (saved && Number(saved.data().applicationUpdatedAt || 0) >= version) return null;
    const title = "New Job Application";
    const jobTitle = typeof job?.title === "string" ? job.title : "Untitled Job";
    const count = currentApplicants.length;
    const body = `${count} cleaner${count === 1 ? "" : "s"} applied for "${jobTitle}"`;
    const ref = db.collection("Notifications").doc(saved?.id ?? `job-application-${jobId}`);
    tx.set(ref, {
      ...(saved?.data() || {}), type: "application", fromUserId: latestApplicant, toUserId: owner,
      jobId, title, body, timestamp, read: false, jobTitle, applicantCount: count,
      applicationUpdatedAt: version,
    });
    return {toUserId: owner, title, body};
  });
};
