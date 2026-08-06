/**
 * Types for the Admin Controls feature.
 *
 * Mirrors the server-side schema written by the Stripe / Apple webhooks in
 * CleanersChoice-Server (lib/subscriptions.js). Keep the two in sync.
 */

/** Values written to `Users.subscriptionStatus` by the webhooks. */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'refunded'
  | 'incomplete'
  | 'none';

/**
 * What the admin UI renders. `unknown` covers docs not yet backfilled.
 *
 * `cancelling` has no equivalent in `subscriptionStatus` — it's derived: the
 * cleaner has turned off renewal (`cancelSubscription`) but is still inside the
 * period they paid for, so they're active today and gone at
 * `subscriptionEndDate`. Surfacing it separately is the difference between the
 * client seeing churn coming and seeing it after the fact.
 */
export type SubscriptionBadgeKey =
  | 'active'
  | 'cancelling'
  | 'overdue'
  | 'cancelled'
  | 'expired'
  | 'none'
  | 'unknown';

export interface ServiceLocation {
  name?: string;
  /** Added at capture time in Location.tsx. Absent on services created before that change. */
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface ServicePackage {
  id?: string | number;
  name?: string;
  price?: number;
  details?: string;
  services?: any[];
}

/** One `CleanerServices/{cleanerUid}` document, joined with its `Users` doc. */
export interface AdminCleanerService {
  /** Document id — this IS the cleaner's uid. */
  id: string;
  name?: string;
  image?: string | null;
  description?: string;
  type?: string[];
  location?: ServiceLocation;
  serviceImages?: string[];
  packages?: ServicePackage[];
  availability?: any[];
  createdAt?: any;
  rating?: number | null;
  reviews?: any[];

  /** Joined from `Users/{id}` — see adminService.fetchCleanerServices(). */
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionEndDate?: number | null;
  cancelSubscription?: boolean;
  subscriptionProvider?: string | null;
  gracePeriodEndsAt?: number | null;
  cleanerEmail?: string | null;
  /** Resolved badge, computed once at fetch time so list rows stay cheap. */
  badge: SubscriptionBadgeKey;
}

export interface AdminJob {
  id: string;
  title?: string;
  status?: string;
  type?: string;
  priceRange?: number | string;
  location?: ServiceLocation;
  createdAt?: any;
  /** The posting customer's uid (the field is confusingly named on the doc). */
  jobId?: string;
  applicants?: string[];
  confirmedCleaner?: string;
  [key: string]: any;
}

export interface AdminStats {
  activeJobs: number;
  cleanerServices: number;
  activeSubscriptions: number;
  overdueSubscriptions: number;
}

/**
 * Registry entry for the admin hub. Adding a future admin feature means adding
 * one entry here plus one screen — no navigation or UI restructuring.
 */
export interface AdminModule {
  key: string;
  title: string;
  subtitle: string;
  /** MaterialCommunityIcons name. */
  icon: string;
  route: string;
  enabled: boolean;
  /** Which stat from AdminStats to show as the row badge, if any. */
  countKey?: keyof AdminStats;
}
