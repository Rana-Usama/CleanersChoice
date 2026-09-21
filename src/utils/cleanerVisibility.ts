import firestore from '@react-native-firebase/firestore';
import {SubscriptionStatus} from '../types/admin';

/**
 * Whether a cleaner is discoverable by customers, decided in ONE place.
 *
 * The rule the product asks for is "active account + valid subscription access
 * right now". Two things make that easy to get wrong, so both are handled here
 * rather than at each call site:
 *
 *   1. `cancelSubscription` (and Stripe's `cancel_at_period_end`) is NOT a
 *      visibility signal. A cleaner who cancels renewal on 15 Sep with a period
 *      running to 30 Sep has paid for those two weeks and stays visible for
 *      them. This module never reads that flag, which is the whole point of it
 *      existing — the flag is only ever a *label* ("Cancelling") in
 *      `subscriptionStatus.ts`.
 *
 *   2. `subscriptionStatus: 'active'` can be stale. A missed webhook (exactly
 *      what a non-delivering Apple notification produces) leaves 'active'
 *      behind while the paid period quietly elapses. So the period end is the
 *      primary test and the status is a veto, never the other way round.
 *
 * ACCESS IS DEFINED THE SAME WAY THE APP ALREADY DEFINES IT: `subscriptionEndDate
 * > now`. That is the gate `StackNavigator` and `resolveCleanerRoute` use to
 * decide whether the cleaner themselves gets past the paywall, and both now call
 * `hasActiveSubscriptionAccess` so there is a single implementation. Keeping
 * them identical matters: a cleaner who is being shown the paywall cannot edit
 * or fulfil their listings, so leaving those listings on the customer side would
 * advertise a cleaner who cannot respond.
 *
 * Deliberately NOT changed here: historical data. Hiding a lapsed cleaner is a
 * read-time filter only — no Jobs, Invoices, Reviews, Chats or CleanerServices
 * documents are touched, so everything comes straight back when they resubscribe.
 */

/** Firestore caps `in` / `documentId() in` at 30 values per query. */
const ID_QUERY_CHUNK_SIZE = 30;

/**
 * Statuses that revoke access immediately, whatever the period end says.
 *
 * Only `refunded` qualifies: the money has gone back, so a period end still in
 * the future is not access that was paid for. `canceled` is deliberately absent
 * (see note 1 above) and so is `past_due` — a renewal charge being retried is
 * still inside the period the cleaner paid for, and the server intentionally
 * does not extend `subscriptionEndDate` into the grace window, so the period end
 * already draws that line.
 */
const ACCESS_REVOKING_STATUSES: SubscriptionStatus[] = ['refunded'];

/** Account states that hide a cleaner. `undefined` means a normal account. */
const INACTIVE_ACCOUNT_STATUSES = ['disabled', 'deleted', 'suspended'];

export interface CleanerVisibilityFields {
  role?: string | null;
  accountStatus?: string | null;
  subscriptionStatus?: SubscriptionStatus | string | null;
  subscription?: boolean;
  subscriptionEndDate?: number | null;
  cancelSubscription?: boolean;
  subscriptionId?: string | null;
  /** Grace floor on the visibility deadline — see resolveVisibleUntil below. */
  visibilityGraceUntil?: number | null;
}

/**
 * Does this user have valid, paid-up subscription access at `now`?
 *
 * This is the SAME decision as the visibility deadline, evaluated at an instant,
 * so it delegates to `resolveVisibleUntil` rather than re-deriving the rule.
 * They were separate implementations until a grace deadline was introduced and
 * the two immediately disagreed — the shared-fixture property test caught it.
 * One implementation is the only way that stays true.
 *
 * Note a missing `subscriptionEndDate` reads as no access. That is intentional
 * and not a regression: the app's own paywall gate has always required the field,
 * so a cleaner without one is already locked out of the cleaner side and has
 * nothing to serve a customer with.
 *
 * DELIBERATE CONSEQUENCE OF SHARING IT: because `StackNavigator` and
 * `resolveCleanerRoute` gate the cleaner's own app access on this function, a
 * granted grace also lets that cleaner back into the app. That is the intent, not
 * a leak. Visible-to-customers but locked-out-of-the-app is the single worst
 * state available — a customer books someone who cannot respond — so a cleaner we
 * are extending the benefit of the doubt to gets both or neither.
 */
export const hasActiveSubscriptionAccess = (
  user?: CleanerVisibilityFields | null,
  now: number = Date.now(),
): boolean => resolveVisibleUntil(user) > now;

/**
 * Does the account still exist and is it usable?
 *
 * Deleting an account today removes the `Users` document (Settings.tsx), so the
 * absent-user case IS the deleted case and `null` correctly reads as inactive.
 * `accountStatus` is checked for the soft-disable path that the customer-flow
 * retirement plan introduces, so this does not need revisiting when it lands.
 */
export const isAccountActive = (
  user?: CleanerVisibilityFields | null,
): boolean => {
  if (!user) return false;

  const status =
    typeof user.accountStatus === 'string'
      ? user.accountStatus.trim().toLowerCase()
      : null;

  if (status && INACTIVE_ACCOUNT_STATUSES.includes(status)) return false;

  return true;
};

/**
 * The rule, whole: active account AND valid subscription access right now.
 * Every customer-facing surface goes through this.
 */
export const isCleanerVisibleToCustomers = (
  user?: CleanerVisibilityFields | null,
  now: number = Date.now(),
): boolean => isAccountActive(user) && hasActiveSubscriptionAccess(user, now);

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

/**
 * Resolve which of `cleanerIds` may be shown, in as few reads as possible.
 *
 * Ids with no `Users` document never make it into the returned set, which is how
 * deleted accounts — and the orphaned `CleanerServices` documents a partially
 * failed deletion leaves behind — get filtered out.
 *
 * On a read error the set comes back EMPTY, i.e. nothing is shown. Failing closed
 * is the right default for a rule whose whole purpose is to not advertise
 * cleaners who cannot take the work.
 */
export const fetchVisibleCleanerIds = async (
  cleanerIds: string[],
  now: number = Date.now(),
): Promise<Set<string>> => {
  const unique = Array.from(new Set(cleanerIds.filter(Boolean)));
  const visible = new Set<string>();
  if (unique.length === 0) return visible;

  try {
    const snapshots = await Promise.all(
      chunk(unique, ID_QUERY_CHUNK_SIZE).map(ids =>
        firestore()
          .collection('Users')
          .where(firestore.FieldPath.documentId(), 'in', ids)
          .get(),
      ),
    );

    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        if (isCleanerVisibleToCustomers(doc.data() as CleanerVisibilityFields, now)) {
          visible.add(doc.id);
        }
      });
    });
  } catch (error) {
    console.log('Cleaner visibility lookup failed:', error);
    return new Set<string>();
  }

  return visible;
};

/**
 * Filter any list of cleaner-keyed records down to the visible ones.
 *
 * Works for `CleanerServices` documents (whose id IS the cleaner's uid) and for
 * anything else carrying the uid — pass `getCleanerId` when it is not `id`.
 */
export const filterVisibleByCleanerId = async <T>(
  records: T[],
  getCleanerId: (record: T) => string | undefined | null,
  now: number = Date.now(),
): Promise<T[]> => {
  if (records.length === 0) return [];

  const ids = records
    .map(getCleanerId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const visible = await fetchVisibleCleanerIds(ids, now);

  return records.filter(record => {
    const id = getCleanerId(record);
    return !!id && visible.has(id);
  });
};

/**
 * Single-cleaner check for detail screens, which are reachable from a list that
 * may have been fetched minutes ago, from a notification, or from a chat.
 *
 * Returns false on a read error, matching `fetchVisibleCleanerIds`.
 */
export const isCleanerIdVisibleToCustomers = async (
  cleanerId?: string | null,
  now: number = Date.now(),
): Promise<boolean> => {
  if (!cleanerId) return false;

  try {
    const doc = await firestore().collection('Users').doc(cleanerId).get();
    if (!doc.exists) return false;
    return isCleanerVisibleToCustomers(doc.data() as CleanerVisibilityFields, now);
  } catch (error) {
    console.log('Cleaner visibility check failed:', error);
    return false;
  }
};

/* ------------------------------------------------------------------------- *
 * Denormalized visibility: `visibleUntil`
 *
 * The predicates above answer "is this cleaner visible?" from a `Users`
 * document. That is correct but it cannot be enforced — a client reading
 * `CleanerServices` directly still sees everyone — and it costs a `Users` read
 * per cleaner on every listing load.
 *
 * So the answer is written onto the document customers actually query, as a
 * DEADLINE rather than a boolean: `CleanerServices/{cleanerId}.visibleUntil`
 * (epoch ms), mirrored onto `Users/{cleanerId}`.
 *
 *   visibleUntil >  now  ->  discoverable
 *   visibleUntil <= now  ->  hidden
 *   visibleUntil == 0    ->  hidden and not on a timer (refund, disabled account)
 *
 * A deadline rather than a flag is the whole point. A boolean would have to be
 * flipped by a scheduled job at the instant a subscription lapses, so a cleaner
 * would stay visible until the next run and the cron would become a correctness
 * dependency. A timestamp compared against `request.time` in a Firestore rule
 * expires exactly on time with nothing running. `resolveVisibleUntil` therefore
 * takes no `now`: it returns a deadline, not a decision, which is what makes a
 * stored value impossible to go stale.
 *
 * Written by, in order of authority:
 *   1. the Stripe/Apple webhooks (`lib/visibility.js` in CleanersChoice-Server)
 *   2. this app, when a cleaner creates their services document — the cleaner
 *      knows their own `subscriptionEndDate` and nothing else would stamp it
 *      until their next subscription event
 *   3. the daily reconciliation sweep (`/api/reconcile-visibility`), for drift
 *
 * A grace deadline (`Users.visibilityGraceUntil`) can raise the value without
 * touching `subscriptionEndDate`. It exists for cleaners whose real entitlement
 * cannot be read from our own data — the Apple cohort whose end date was
 * stranded because renewals only ever advance it via DID_RENEW. It is a FLOOR,
 * never a ceiling: a real subscription running past it wins, and the hard
 * revocations (refund, inactive account) ignore it entirely, so a grace can
 * never resurrect someone whose money went back.
 *
 * MUST STAY IN SYNC with `computeVisibleUntil()` in the server's
 * lib/visibility.js. `__tests__/fixtures/visibility-fixtures.json` is the shared
 * contract both sides assert against; the copy in the server repo is
 * scripts/visibility-fixtures.json and the two files are byte-identical.
 * ------------------------------------------------------------------------- */

/** Hidden, and not on a timer. */
export const VISIBILITY_REVOKED = 0;

/**
 * Clock-skew tolerance, in ms, that the Firestore rule allows on top of the
 * deadline (see firestore.rules).
 *
 * The rule compares `visibleUntil` against the SERVER's clock while the query
 * filters on the DEVICE's clock. A device running behind would otherwise ask
 * for documents the rule rejects — and a rejected document fails the whole
 * `list` query, not just that row, which would blank the customer's home screen
 * rather than hide one cleaner. The rule is given five minutes of slack so that
 * cannot happen, and `isServiceVisible` below applies the exact cut locally, so
 * a document inside the slack window is fetched and then dropped.
 */
export const VISIBILITY_CLOCK_SKEW_MS = 5 * 60 * 1000;

export interface VisibleUntilFields {
  visibleUntil?: number | null;
}

/** A usable grace deadline, or 0. */
const resolveGraceUntil = (user?: CleanerVisibilityFields | null): number => {
  const grace = user?.visibilityGraceUntil;
  return typeof grace === 'number' && Number.isFinite(grace) && grace > 0
    ? grace
    : 0;
};

/**
 * The deadline after which this cleaner stops being discoverable.
 * Mirror of `computeVisibleUntil()` on the server. Takes no clock, on purpose.
 */
export const resolveVisibleUntil = (
  user?: CleanerVisibilityFields | null,
): number => {
  if (!user) return VISIBILITY_REVOKED;

  if (!isAccountActive(user)) return VISIBILITY_REVOKED;

  // Consulted only as a veto, never to grant visibility — a missed webhook
  // leaves a stale 'active' behind while the period quietly elapses.
  //
  // The RAW field is read here rather than `resolveSubscriptionStatus()`, which
  // this module used to call. That helper takes a clock (it downgrades a stale
  // 'active' to 'expired' relative to `now`), and this function must stay
  // time-independent — a deadline that shifts with the clock is a stored value
  // that can go stale. The two agree in any case: the legacy derivation inside
  // that helper can never produce 'refunded', so for the only revoking status
  // there is, the raw field and the resolved one are the same value.
  if (
    typeof user.subscriptionStatus === 'string' &&
    ACCESS_REVOKING_STATUSES.includes(
      user.subscriptionStatus as SubscriptionStatus,
    )
  ) {
    return VISIBILITY_REVOKED;
  }

  const end =
    typeof user.subscriptionEndDate === 'number' &&
    Number.isFinite(user.subscriptionEndDate)
      ? user.subscriptionEndDate
      : 0;

  // The grace is a FLOOR — whichever deadline is later wins, so granting one can
  // only extend visibility and can never cut a real subscription short.
  const until = Math.max(end > 0 ? end : 0, resolveGraceUntil(user));

  return until > 0 ? until : VISIBILITY_REVOKED;
};

/**
 * Exact local cut for a document that already carries `visibleUntil`.
 *
 * Free — no Firestore read. Used as the final pass over query results so the
 * rule's clock-skew slack never actually shows a lapsed cleaner.
 */
export const isServiceVisible = (
  service?: VisibleUntilFields | null,
  now: number = Date.now(),
): boolean =>
  typeof service?.visibleUntil === 'number' && service.visibleUntil > now;

/**
 * Value to stamp on a `CleanerServices` document the signed-in cleaner is
 * writing for themselves.
 *
 * `ServiceOne` creates that document with `.set()` — a full overwrite, not a
 * merge — so leaving the field out would erase it on every re-save and make the
 * cleaner's own listing vanish. Their `Users` document is already in Redux by
 * then, so this costs nothing.
 *
 * A cleaner cannot use this to grant themselves visibility: `firestore.rules`
 * caps the value they may write at their own `Users.subscriptionEndDate`, and
 * the subscription fields on `Users` are server-write-only.
 */
export const visibilityFieldsForOwnService = (
  userData?: CleanerVisibilityFields | null,
): {visibleUntil: number; visibilityUpdatedAt: number} => ({
  visibleUntil: resolveVisibleUntil(userData),
  visibilityUpdatedAt: Date.now(),
});
