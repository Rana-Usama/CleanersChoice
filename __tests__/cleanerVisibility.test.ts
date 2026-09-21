/**
 * The customer-facing cleaner visibility rule.
 *
 * Every scenario in the requirement is asserted here, because the expensive
 * failure mode is not a crash — it is quietly showing (or quietly hiding) the
 * wrong cleaner, which nobody notices until a customer books someone who has
 * lapsed.
 */
import {
  hasActiveSubscriptionAccess,
  isAccountActive,
  isCleanerVisibleToCustomers,
  fetchVisibleCleanerIds,
  isCleanerIdVisibleToCustomers,
  resolveVisibleUntil,
  isServiceVisible,
  visibilityFieldsForOwnService,
  VISIBILITY_REVOKED,
} from '../src/utils/cleanerVisibility';
import fixtures from './fixtures/visibility-fixtures.json';

jest.mock('@react-native-firebase/firestore', () => {
  const store = () => (global as any).__USERS__ || {};
  const has = (id: string) =>
    Object.prototype.hasOwnProperty.call(store(), id);

  const firestoreFn: any = () => ({
    collection: () => ({
      doc: (id: string) => ({
        get: async () => {
          if ((global as any).__THROW__) throw new Error('offline');
          return {id, exists: has(id), data: () => store()[id]};
        },
      }),
      where: (_field: any, _op: any, ids: string[]) => ({
        get: async () => {
          if ((global as any).__THROW__) throw new Error('offline');
          (global as any).__CHUNKS__.push(ids.length);
          return {
            docs: ids
              .filter(has)
              .map(id => ({id, data: () => store()[id]})),
          };
        },
      }),
    }),
  });
  firestoreFn.FieldPath = {documentId: () => '__name__'};
  return {__esModule: true, default: firestoreFn};
});

// 15 Sep 2026, the day the cleaner in the requirement cancels renewal.
const NOW = new Date('2026-09-15T12:00:00Z').getTime();
const SEP_30 = new Date('2026-09-30T23:59:59Z').getTime();
const AUG_31 = new Date('2026-08-31T23:59:59Z').getTime();

beforeEach(() => {
  (global as any).__USERS__ = {};
  (global as any).__CHUNKS__ = [];
  (global as any).__THROW__ = false;
});

describe('hasActiveSubscriptionAccess', () => {
  it('shows a straightforwardly active subscription', () => {
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'active', subscription: true, subscriptionEndDate: SEP_30},
        NOW,
      ),
    ).toBe(true);
  });

  it('keeps a cancelled-but-paid cleaner visible until the period ends', () => {
    // The requirement's worked example: subscribed to 30 Sep, cancelled 15 Sep.
    const cancelledMidPeriod = {
      subscriptionStatus: 'active',
      subscription: true,
      cancelSubscription: true,
      subscriptionEndDate: SEP_30,
    };
    expect(hasActiveSubscriptionAccess(cancelledMidPeriod, NOW)).toBe(true);
    // ...and drops out by itself the moment the paid period elapses.
    expect(
      hasActiveSubscriptionAccess(cancelledMidPeriod, SEP_30 + 1000),
    ).toBe(false);
  });

  it('hides a cleaner whose cancelled period has ended', () => {
    expect(
      hasActiveSubscriptionAccess(
        {
          subscriptionStatus: 'canceled',
          subscription: true,
          cancelSubscription: true,
          subscriptionEndDate: AUG_31,
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('hides a stale active status whose period has quietly elapsed', () => {
    // A missed Apple/Stripe webhook leaves subscriptionStatus behind.
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'active', subscription: true, subscriptionEndDate: AUG_31},
        NOW,
      ),
    ).toBe(false);
  });

  it('hides an expired subscription that was never renewed', () => {
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'expired', subscription: true, subscriptionEndDate: AUG_31},
        NOW,
      ),
    ).toBe(false);
  });

  it('hides a refunded subscription even inside the paid period', () => {
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'refunded', subscription: true, subscriptionEndDate: SEP_30},
        NOW,
      ),
    ).toBe(false);
  });

  it('keeps past_due visible while the paid period is still running', () => {
    // The renewal charge is being retried; the period they paid for is not over.
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'past_due', subscription: true, subscriptionEndDate: SEP_30},
        NOW,
      ),
    ).toBe(true);
    expect(
      hasActiveSubscriptionAccess(
        {subscriptionStatus: 'past_due', subscription: true, subscriptionEndDate: AUG_31},
        NOW,
      ),
    ).toBe(false);
  });

  it('hides a cleaner who never subscribed', () => {
    expect(hasActiveSubscriptionAccess({subscriptionStatus: 'none'}, NOW)).toBe(false);
    expect(hasActiveSubscriptionAccess({}, NOW)).toBe(false);
    expect(hasActiveSubscriptionAccess(null, NOW)).toBe(false);
  });

  it('hides a subscription with no period end at all', () => {
    // Matches the app's own paywall, which has always required the field — such
    // a cleaner is already locked out of the cleaner side.
    expect(
      hasActiveSubscriptionAccess({subscription: true, subscriptionEndDate: null}, NOW),
    ).toBe(false);
  });

  it('never consults the cancellation flag on its own', () => {
    const a = {subscription: true, subscriptionEndDate: SEP_30, cancelSubscription: true};
    const b = {subscription: true, subscriptionEndDate: SEP_30, cancelSubscription: false};
    expect(hasActiveSubscriptionAccess(a, NOW)).toBe(
      hasActiveSubscriptionAccess(b, NOW),
    );
  });
});

describe('isAccountActive', () => {
  it('treats a missing user document as a deleted account', () => {
    expect(isAccountActive(null)).toBe(false);
    expect(isAccountActive(undefined)).toBe(false);
  });

  it('treats an account with no status field as normal', () => {
    expect(isAccountActive({})).toBe(true);
    expect(isAccountActive({accountStatus: 'active'})).toBe(true);
  });

  it('hides disabled, deleted and suspended accounts, case-insensitively', () => {
    expect(isAccountActive({accountStatus: 'disabled'})).toBe(false);
    expect(isAccountActive({accountStatus: 'Deleted'})).toBe(false);
    expect(isAccountActive({accountStatus: ' SUSPENDED '})).toBe(false);
  });
});

describe('isCleanerVisibleToCustomers', () => {
  it('needs both halves of the rule', () => {
    const paid = {subscription: true, subscriptionEndDate: SEP_30};
    expect(isCleanerVisibleToCustomers(paid, NOW)).toBe(true);
    expect(
      isCleanerVisibleToCustomers({...paid, accountStatus: 'disabled'}, NOW),
    ).toBe(false);
    expect(
      isCleanerVisibleToCustomers({subscription: true, subscriptionEndDate: AUG_31}, NOW),
    ).toBe(false);
  });
});

describe('fetchVisibleCleanerIds', () => {
  it('returns only the cleaners who pass the rule', async () => {
    (global as any).__USERS__ = {
      live: {subscription: true, subscriptionEndDate: SEP_30},
      cancelledButPaid: {
        subscription: true,
        cancelSubscription: true,
        subscriptionStatus: 'active',
        subscriptionEndDate: SEP_30,
      },
      lapsed: {subscription: true, subscriptionEndDate: AUG_31},
      refunded: {
        subscription: true,
        subscriptionStatus: 'refunded',
        subscriptionEndDate: SEP_30,
      },
      disabled: {
        subscription: true,
        subscriptionEndDate: SEP_30,
        accountStatus: 'disabled',
      },
    };

    const visible = await fetchVisibleCleanerIds(
      ['live', 'cancelledButPaid', 'lapsed', 'refunded', 'disabled', 'deletedAccount'],
      NOW,
    );

    expect(Array.from(visible).sort()).toEqual(['cancelledButPaid', 'live']);
  });

  it('drops ids with no user document (deleted accounts, orphaned services)', async () => {
    (global as any).__USERS__ = {kept: {subscription: true, subscriptionEndDate: SEP_30}};
    const visible = await fetchVisibleCleanerIds(['kept', 'goneForever'], NOW);
    expect(visible.has('kept')).toBe(true);
    expect(visible.has('goneForever')).toBe(false);
  });

  it('chunks id lookups to Firestore’s 30-value limit', async () => {
    const ids = Array.from({length: 71}, (_, i) => `c${i}`);
    await fetchVisibleCleanerIds(ids, NOW);
    expect((global as any).__CHUNKS__.sort((a: number, b: number) => b - a)).toEqual([
      30, 30, 11,
    ]);
  });

  it('de-duplicates ids and short-circuits an empty list', async () => {
    (global as any).__USERS__ = {dup: {subscription: true, subscriptionEndDate: SEP_30}};
    await fetchVisibleCleanerIds(['dup', 'dup', 'dup'], NOW);
    expect((global as any).__CHUNKS__).toEqual([1]);

    (global as any).__CHUNKS__ = [];
    expect((await fetchVisibleCleanerIds([], NOW)).size).toBe(0);
    expect((global as any).__CHUNKS__).toEqual([]);
  });

  it('fails closed when the lookup errors', async () => {
    (global as any).__USERS__ = {live: {subscription: true, subscriptionEndDate: SEP_30}};
    (global as any).__THROW__ = true;
    expect((await fetchVisibleCleanerIds(['live'], NOW)).size).toBe(0);
  });
});

describe('isCleanerIdVisibleToCustomers', () => {
  it('answers for a single cleaner and fails closed', async () => {
    (global as any).__USERS__ = {
      live: {subscription: true, subscriptionEndDate: SEP_30},
      lapsed: {subscription: true, subscriptionEndDate: AUG_31},
    };
    expect(await isCleanerIdVisibleToCustomers('live', NOW)).toBe(true);
    expect(await isCleanerIdVisibleToCustomers('lapsed', NOW)).toBe(false);
    expect(await isCleanerIdVisibleToCustomers('deleted', NOW)).toBe(false);
    expect(await isCleanerIdVisibleToCustomers(null, NOW)).toBe(false);

    (global as any).__THROW__ = true;
    expect(await isCleanerIdVisibleToCustomers('live', NOW)).toBe(false);
  });
});


/**
 * The shared contract with the server.
 *
 * `__tests__/fixtures/visibility-fixtures.json` is byte-identical to
 * `scripts/visibility-fixtures.json` in CleanersChoice-Server, and both
 * implementations assert against it — `resolveVisibleUntil()` here,
 * `computeVisibleUntil()` there (scripts/verify-visibility.js). If the two ever
 * drift, one of the two suites fails, which is the only mechanism that keeps a
 * denormalized field honest across two codebases.
 */
describe('resolveVisibleUntil — shared contract with the server', () => {
  fixtures.cases.forEach(testCase => {
    it(testCase.name, () => {
      expect(resolveVisibleUntil(testCase.user as any)).toBe(
        testCase.visibleUntil,
      );
      expect(
        isServiceVisible(
          {visibleUntil: resolveVisibleUntil(testCase.user as any)},
          fixtures.now,
        ),
      ).toBe(testCase.visibleNow);
    });
  });

  it('revokes a missing user', () => {
    expect(resolveVisibleUntil(null)).toBe(VISIBILITY_REVOKED);
    expect(resolveVisibleUntil(undefined)).toBe(VISIBILITY_REVOKED);
  });

  it('is time-independent, which is what stops a stored value going stale', () => {
    const user = {subscription: true, subscriptionEndDate: fixtures.sep30};
    expect(resolveVisibleUntil(user)).toBe(resolveVisibleUntil(user));
    expect(resolveVisibleUntil(user)).toBe(fixtures.sep30);
  });

  it('agrees with the Users-document predicate at every instant tested', () => {
    // The two must never disagree: one is a deadline, the other is the same
    // rule evaluated at an instant.
    fixtures.cases.forEach(testCase => {
      const byPredicate = isCleanerVisibleToCustomers(
        testCase.user as any,
        fixtures.now,
      );
      const byDeadline = resolveVisibleUntil(testCase.user as any) > fixtures.now;
      expect(byDeadline).toBe(byPredicate);
    });
  });
});

describe('isServiceVisible', () => {
  it('needs a real number in the future', () => {
    expect(isServiceVisible({visibleUntil: fixtures.sep30}, fixtures.now)).toBe(true);
    expect(isServiceVisible({visibleUntil: fixtures.aug31}, fixtures.now)).toBe(false);
    expect(isServiceVisible({visibleUntil: 0}, fixtures.now)).toBe(false);
    expect(isServiceVisible({visibleUntil: null}, fixtures.now)).toBe(false);
    expect(isServiceVisible({}, fixtures.now)).toBe(false);
    expect(isServiceVisible(null, fixtures.now)).toBe(false);
  });

  it('treats a document written before the field existed as hidden', () => {
    // Matches Firestore, which silently skips such documents in an inequality
    // filter. This is exactly why the backfill has to run before enforcement.
    expect(isServiceVisible({name: 'Deep clean'} as any, fixtures.now)).toBe(false);
  });
});

describe('visibilityFieldsForOwnService', () => {
  it('stamps the cleaner own deadline plus an audit timestamp', () => {
    const fields = visibilityFieldsForOwnService({
      subscription: true,
      subscriptionEndDate: fixtures.sep30,
    });
    expect(fields.visibleUntil).toBe(fixtures.sep30);
    expect(typeof fields.visibilityUpdatedAt).toBe('number');
  });

  it('cannot be used to self-grant visibility from a lapsed account', () => {
    expect(
      visibilityFieldsForOwnService({
        subscription: true,
        subscriptionStatus: 'refunded',
        subscriptionEndDate: fixtures.sep30,
      }).visibleUntil,
    ).toBe(VISIBILITY_REVOKED);
  });
});
