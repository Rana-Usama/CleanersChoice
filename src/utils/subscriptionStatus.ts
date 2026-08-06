import {Colors} from '../constants/Themes';
import {
  SubscriptionBadgeKey,
  SubscriptionStatus,
} from '../types/admin';

/**
 * Resolving a cleaner's subscription state for the admin views.
 *
 * `Users.subscriptionStatus` is the source of truth, written by the Stripe and
 * Apple webhooks. It is optional by design: users who existed before that field
 * was introduced (and who haven't had a webhook fire since) won't have it, and
 * the backfill script is optional. So every read goes through
 * `resolveSubscriptionStatus`, which falls back to deriving a status from the
 * legacy fields the app has always written.
 *
 * The fallback mirrors `deriveLegacyStatus()` in CleanersChoice-Server
 * (lib/subscriptions.js) so the app and the backfill agree.
 */

interface SubscriptionFields {
  subscriptionStatus?: SubscriptionStatus | string | null;
  subscription?: boolean;
  subscriptionEndDate?: number | null;
  cancelSubscription?: boolean;
  subscriptionId?: string | null;
}

const KNOWN_STATUSES: SubscriptionStatus[] = [
  'active',
  'past_due',
  'canceled',
  'expired',
  'refunded',
  'incomplete',
  'none',
];

/**
 * Returns the canonical status, or null when it genuinely cannot be determined
 * (no `subscriptionStatus` and no legacy fields to derive from).
 */
export const resolveSubscriptionStatus = (
  user?: SubscriptionFields | null,
  now: number = Date.now(),
): SubscriptionStatus | null => {
  if (!user) return null;

  const end =
    typeof user.subscriptionEndDate === 'number' ? user.subscriptionEndDate : null;

  // 1. Source of truth, when the webhooks have written it.
  const stored = user.subscriptionStatus;
  if (
    typeof stored === 'string' &&
    KNOWN_STATUSES.includes(stored as SubscriptionStatus)
  ) {
    // ...but cross-check `active` against the end date. A missed webhook leaves
    // `subscriptionStatus: 'active'` behind while the period quietly elapses —
    // not hypothetical, that is exactly what a non-delivering Apple webhook
    // produces. Reporting "Active" there would contradict the app itself, which
    // gates access on `subscriptionEndDate > now` (StackNavigator.tsx) and is
    // already showing that cleaner the paywall. The admin view has to agree with
    // what the cleaner actually experiences.
    //
    // `past_due` is deliberately exempt: an elapsed end date is what past_due
    // MEANS (the renewal charge is still being retried), so expiring it here
    // would destroy the Overdue signal.
    if (stored === 'active' && end !== null && end <= now) return 'expired';
    return stored as SubscriptionStatus;
  }

  // 2. Legacy fallback. Deliberately conservative — it never reports a paying
  //    cleaner as lapsed.
  const hasEverSubscribed = !!user.subscription || !!user.subscriptionId;

  if (!hasEverSubscribed) return 'none';
  if (end === null) return user.subscription ? 'active' : 'expired';
  if (end <= now) return 'expired';
  return 'active';
};

/**
 * Map a stored status onto a badge.
 *
 * `canceled` gets its own badge: someone choosing to leave is a different
 * signal from drifting off the end of a period, and it's the one the client can
 * act on.
 *
 * `refunded` and `incomplete` still fold into "Expired" — both mean no live
 * subscription, and both are rare enough that separate colours would add noise
 * without adding information. They stay distinct in Firestore, so splitting
 * them later is two lines here plus a palette entry.
 */
export const toBadgeKey = (
  status: SubscriptionStatus | null,
): SubscriptionBadgeKey => {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'overdue';
    case 'canceled':
      return 'cancelled';
    case 'expired':
    case 'refunded':
    case 'incomplete':
      return 'expired';
    case 'none':
      return 'none';
    default:
      return 'unknown';
  }
};

export interface BadgeStyle {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: string;
  iconName: string;
}

/** Palette built from existing theme tokens so nothing new is introduced. */
export const SUBSCRIPTION_BADGES: Record<SubscriptionBadgeKey, BadgeStyle> = {
  active: {
    label: 'Active',
    bg: Colors.greenBg100,
    border: Colors.greenBorder,
    text: Colors.green800,
    icon: Colors.green500,
    iconName: 'check-circle',
  },
  // Informational, not a problem — they're still paid up. Deliberately blue
  // rather than amber so it can't be confused with Overdue.
  cancelling: {
    label: 'Cancelling',
    bg: Colors.blueBg50,
    border: Colors.lightBlueBorder,
    text: Colors.slateBlue,
    icon: Colors.slateBlue,
    iconName: 'calendar-clock',
  },
  // Churned by choice. Slate rather than red: it's terminal, but it isn't a
  // payment failure the client can chase.
  cancelled: {
    label: 'Cancelled',
    bg: Colors.slate100,
    border: Colors.slate300,
    text: Colors.slate900,
    icon: Colors.slate500,
    iconName: 'cancel',
  },
  overdue: {
    label: 'Overdue',
    bg: Colors.amberBg50,
    border: Colors.amberBorder,
    text: Colors.amberDarkText,
    icon: Colors.amber500,
    iconName: 'alert-circle-outline',
  },
  expired: {
    label: 'Expired',
    bg: Colors.redBg50,
    border: Colors.redBorder200,
    text: Colors.red500,
    icon: Colors.red500,
    iconName: 'close-circle-outline',
  },
  none: {
    label: 'No Subscription',
    bg: Colors.gray50,
    border: Colors.gray200,
    text: Colors.secondaryText,
    icon: Colors.placeholderColor,
    iconName: 'minus-circle-outline',
  },
  unknown: {
    label: 'Unknown',
    bg: Colors.gray50,
    border: Colors.gray300,
    text: Colors.placeholderColor,
    icon: Colors.placeholderColor,
    iconName: 'help-circle-outline',
  },
};

export const getSubscriptionBadge = (key: SubscriptionBadgeKey): BadgeStyle =>
  SUBSCRIPTION_BADGES[key] ?? SUBSCRIPTION_BADGES.unknown;

/**
 * Convenience: user doc -> badge key in one call.
 *
 * Also derives the `cancelling` state, which no stored status expresses: renewal
 * is off but the paid period hasn't ended, so the cleaner is active today and
 * leaving on `subscriptionEndDate`.
 *
 * Note this only upgrades an otherwise-`active` badge. The Apple webhook also
 * sets `cancelSubscription: true` on EXPIRED/REFUND, but those resolve to
 * expired/refunded first, so they can't be mistaken for a pending cancellation.
 */
export const getBadgeKeyForUser = (
  user?: SubscriptionFields | null,
  now: number = Date.now(),
): SubscriptionBadgeKey => {
  const key = toBadgeKey(resolveSubscriptionStatus(user, now));

  if (key === 'active' && user?.cancelSubscription) {
    const end =
      typeof user?.subscriptionEndDate === 'number'
        ? user.subscriptionEndDate
        : null;
    if (end !== null && end > now) return 'cancelling';
  }

  return key;
};

/**
 * Filter chips for the Cleaner Services admin screen.
 *
 * A chip can cover more than one badge — "Cancelled" matches both the pending
 * and the completed cancellation, because the client's question is "who is
 * leaving or has left", not which half of that they're in. `matches: []` means
 * no filtering (the All chip).
 */
export const SUBSCRIPTION_FILTERS: Array<{
  key: string;
  label: string;
  matches: SubscriptionBadgeKey[];
}> = [
  {key: 'all', label: 'All', matches: []},
  {key: 'active', label: 'Active', matches: ['active']},
  {key: 'overdue', label: 'Overdue', matches: ['overdue']},
  {key: 'cancelled', label: 'Cancelled', matches: ['cancelling', 'cancelled']},
  {key: 'expired', label: 'Expired', matches: ['expired']},
];

/** Does a badge belong under a given filter chip? */
export const matchesFilter = (
  filterKey: string,
  badge: SubscriptionBadgeKey,
): boolean => {
  if (filterKey === 'all') return true;
  const chip = SUBSCRIPTION_FILTERS.find(f => f.key === filterKey);
  if (!chip || chip.matches.length === 0) return true;
  return chip.matches.includes(badge);
};
