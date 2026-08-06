import firestore from '@react-native-firebase/firestore';
import {
  AdminCleanerService,
  AdminJob,
  AdminStats,
  SubscriptionStatus,
} from '../types/admin';
import {getBadgeKeyForUser, resolveSubscriptionStatus} from '../utils/subscriptionStatus';

/**
 * Data layer for the Admin Controls screens.
 *
 * Query notes:
 *  - Sorting is done in JS rather than with `.orderBy()`. Two reasons: a
 *    `where(status) + orderBy(createdAt)` pair on `Jobs` would need a new
 *    composite index (deployment friction), and `orderBy('createdAt')` on
 *    `CleanerServices` silently DROPS documents that lack the field — which is
 *    exactly the sort of gap an admin view exists to surface. The existing
 *    CleanerJobs screen already sorts client-side, so this matches the codebase.
 *  - Raw `firestore().get()` is used, matching every other screen in the app.
 *    No new data-fetching dependency is introduced.
 */

/** Firestore caps `in` queries at 30 values. */
const IN_QUERY_LIMIT = 30;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Firestore Timestamp | Date | number -> ms, for client-side sorting. */
const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
};

const byNewestFirst = (a: any, b: any) =>
  toMillis(b?.createdAt) - toMillis(a?.createdAt);

/* ------------------------------------------------------------------ *
 * Active jobs
 * ------------------------------------------------------------------ */

/**
 * Every ACTIVE customer-posted job, platform-wide.
 *
 * Same collection and same `status == 'active'` filter the cleaner Job List
 * already uses (CleanerJobs.tsx), minus the 50 km distance filter — the whole
 * point of the admin view. Completed / cancelled / expired / unconfirmed jobs
 * are excluded at the query level.
 */
export const fetchActiveJobs = async (): Promise<AdminJob[]> => {
  const snapshot = await firestore()
    .collection('Jobs')
    .where('status', '==', 'active')
    .get();

  const jobs: AdminJob[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as object),
  })) as AdminJob[];

  return jobs.sort(byNewestFirst);
};

/* ------------------------------------------------------------------ *
 * Cleaner services (+ subscription join)
 * ------------------------------------------------------------------ */

/**
 * Every cleaner service profile, joined with the owning cleaner's subscription
 * state.
 *
 * `CleanerServices` is keyed by the cleaner's uid (one document per cleaner), so
 * the join is a document-id lookup against `Users`. Batched 30 at a time via
 * `documentId() in [...]` rather than one read per row.
 */
export const fetchCleanerServices = async (): Promise<AdminCleanerService[]> => {
  const snapshot = await firestore().collection('CleanerServices').get();

  if (snapshot.empty) return [];

  const services = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as object),
  })) as AdminCleanerService[];

  // --- batched Users join ---
  const usersById = new Map<string, any>();
  const idChunks = chunk(
    services.map(service => service.id),
    IN_QUERY_LIMIT,
  );

  await Promise.all(
    idChunks.map(async ids => {
      try {
        const usersSnap = await firestore()
          .collection('Users')
          .where(firestore.FieldPath.documentId(), 'in', ids)
          .get();
        usersSnap.docs.forEach(doc => usersById.set(doc.id, doc.data()));
      } catch (error) {
        // A failed chunk must not blank the whole screen — those rows simply
        // render an "Unknown" subscription badge.
        console.log('[adminService] Users join chunk failed:', error);
      }
    }),
  );

  const now = Date.now();

  return services
    .map(service => {
      const user = usersById.get(service.id);
      return {
        ...service,
        subscriptionStatus: resolveSubscriptionStatus(user, now) as
          | SubscriptionStatus
          | null,
        subscriptionEndDate: user?.subscriptionEndDate ?? null,
        cancelSubscription: !!user?.cancelSubscription,
        subscriptionProvider: user?.subscriptionProvider ?? null,
        gracePeriodEndsAt: user?.gracePeriodEndsAt ?? null,
        cleanerEmail: user?.email ?? null,
        // Cleaner name lives on the service doc, but fall back to the Users doc
        // if a service was written before the name was copied across.
        name: service.name || user?.name || '',
        image: service.image ?? user?.profile ?? null,
        badge: getBadgeKeyForUser(user, now),
      };
    })
    .sort(byNewestFirst);
};

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

/**
 * Counts for the hub tiles. Uses Firestore's `count()` aggregation for the two
 * simple totals (no documents downloaded), and derives the subscription splits
 * from the already-joined services list so we don't read `Users` twice.
 */
export const fetchAdminStats = async (
  services?: AdminCleanerService[],
): Promise<AdminStats> => {
  const [activeJobs, cleanerServices] = await Promise.all([
    firestore()
      .collection('Jobs')
      .where('status', '==', 'active')
      .count()
      .get()
      .then(snap => snap.data().count)
      .catch(() => 0),
    firestore()
      .collection('CleanerServices')
      .count()
      .get()
      .then(snap => snap.data().count)
      .catch(() => 0),
  ]);

  const list = services ?? [];

  return {
    activeJobs,
    cleanerServices: cleanerServices || list.length,
    // A cleaner with a pending cancellation still has a live, paid subscription
    // today, so they belong in this count — the Cancelled chip on the services
    // screen is where the client sees them as churn.
    activeSubscriptions: list.filter(
      s => s.badge === 'active' || s.badge === 'cancelling',
    ).length,
    overdueSubscriptions: list.filter(s => s.badge === 'overdue').length,
  };
};
