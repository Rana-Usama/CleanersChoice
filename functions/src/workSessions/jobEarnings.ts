import type {Firestore} from "firebase-admin/firestore";

/**
 * Job-level earnings ledger for fixed-price work.
 *
 * Hourly and general work accrue per session from paySnapshot.hourlyRate, so
 * they are derivable from the sessions a month report already loads and never
 * appear here - writing them would double-count.
 *
 * Flat and sqft work cannot be derived from hours at all: a $50 job is worth
 * $50 whether it took 2h or 7h, and the governing rule is that a fixed price is
 * never divided across its sessions. So its value is recognised ONCE, at
 * completion, as one document keyed by job id.
 *
 * Keying by job id makes every write an idempotent upsert, so a double
 * completion - or a retried trigger delivery - cannot double-count.
 */

export const JOB_EARNINGS = "JobEarnings";
/** Values above this are rejected as data errors rather than stored as money. */
const MAX_JOB_VALUE = 1_000_000;

export type JobEarningBasis = "flat" | "sqft";

export interface JobEarning {
  jobId: string;
  cleanerId: string;
  basis: JobEarningBasis;
  amount: number;
  /** Authoritative commit time of the completion that recognised this. */
  completedAt: number;
  source: "jobCompletion";
  revision: number;
  updatedAt: number;
}

/**
 * Money parsing must keep cents. The client used to strip the decimal point
 * before storing, so historical rows may hold a hundredfold value; that is not
 * repaired here, because a stored 5050 cannot be told apart from a real $5,050.
 *
 * @param {unknown} value Raw price field from a Jobs document.
 * @return {number} The amount in dollars, or 0 when unusable.
 */
export const parseJobMoney = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? round(value) : 0;
  }
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const normalised = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : parts[0];
  const amount = Number(normalised);
  return Number.isFinite(amount) && amount > 0 ? round(amount) : 0;
};

/**
 * @param {number} value Amount to round.
 * @return {number} The amount rounded to two decimals without float drift.
 */
const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * @param {unknown} value Candidate budget type.
 * @return {boolean} True for the fixed-price bases this ledger covers.
 */
/**
 * Resolve a job's earning basis the SAME way the pay snapshot does.
 *
 * operations.ts treats a job with no budgetType as "flat" (it is the final
 * else of its ternary). This used to disagree with the ledger, which required
 * an explicit "flat"/"sqft" - so a legacy job with no budgetType was
 * snapshotted as flat (earning nothing per session, because flat money is
 * job-level) and then skipped here on completion, earning nothing at all.
 * Hours recorded, money silently zero, with nothing to show it had happened.
 *
 * Only "hourly" accrues per session; everything else is fixed price.
 *
 * @param {unknown} value The job's budgetType, which may be absent.
 * @return {JobEarningBasis|null} The ledger basis, or null when it accrues
 *   per session instead.
 */
const earningBasis = (value: unknown): JobEarningBasis | null => {
  if (value === "hourly") return null;
  return value === "sqft" ? "sqft" : "flat";
};

/**
 * A job counts as complete only in its terminal completed state.
 *
 * @param {Record<string, unknown>|undefined} job The job document data.
 * @return {boolean} True when the job has completed.
 */
const isCompleted = (job: Record<string, unknown> | undefined): boolean =>
  job?.status === "completed";

/**
 * What the ledger should hold for a job in its current state, or null when the
 * job earns nothing here (not complete, hourly/general, no cleaner, no amount).
 *
 * @param {string} jobId The job's document id.
 * @param {Record<string, unknown>|undefined} job The job document data.
 * @param {number} occurredAt Authoritative commit time of the write.
 * @return {object|null} The row the ledger should hold, or null for none.
 */
export const resolveJobEarning = (
  jobId: string,
  job: Record<string, unknown> | undefined,
  occurredAt: number,
): Omit<JobEarning, "revision" | "updatedAt"> | null => {
  if (!isCompleted(job) || !job) return null;
  const basis = earningBasis(job.budgetType);
  if (!basis) return null;
  const cleanerId = typeof job.confirmedCleaner === "string" ? job.confirmedCleaner : "";
  if (!cleanerId) return null;
  const amount = parseJobMoney(job.priceRange);
  if (amount <= 0 || amount > MAX_JOB_VALUE) return null;
  return {jobId, cleanerId, basis, amount, completedAt: occurredAt, source: "jobCompletion"};
};

/**
 * Reconcile one job's ledger row against a Jobs write.
 *
 * - completed, fixed price      -> upsert
 * - price or cleaner amended    -> amend in place, KEEPING the original
 *                                  completedAt so a correction never moves
 *                                  money between months
 * - completion reverted/deleted -> remove, so the ledger stays truthful
 *
 * @param {Firestore} db Firestore instance.
 * @param {string} jobId The job's document id.
 * @param {Record<string, unknown>|undefined} after The job data after the write.
 * @param {number} occurredAt Authoritative commit time of the write.
 * @return {Promise<string>} What the reconcile did to the ledger row.
 */
export const reconcileJobEarning = async (
  db: Firestore,
  jobId: string,
  after: Record<string, unknown> | undefined,
  occurredAt: number,
): Promise<"created" | "amended" | "removed" | "unchanged"> => {
  const ref = db.collection(JOB_EARNINGS).doc(jobId);
  const desired = resolveJobEarning(jobId, after, occurredAt);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const existing = snapshot.exists ? (snapshot.data() as JobEarning) : null;

    if (!desired) {
      if (!existing) return "unchanged";
      tx.delete(ref);
      return "removed";
    }

    if (!existing) {
      tx.set(ref, {...desired, revision: 1, updatedAt: occurredAt});
      return "created";
    }

    const same =
      existing.amount === desired.amount &&
      existing.cleanerId === desired.cleanerId &&
      existing.basis === desired.basis;
    if (same) return "unchanged";

    // A later edit corrects the amount but must not re-date the recognition:
    // moving money between months on an edit would silently restate a month
    // the cleaner has already seen.
    tx.set(ref, {
      ...desired,
      completedAt: existing.completedAt,
      revision: (existing.revision || 1) + 1,
      updatedAt: occurredAt,
    });
    return "amended";
  });
};
