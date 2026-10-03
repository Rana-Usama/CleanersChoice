import firestore from '@react-native-firebase/firestore';
import {
  CleanerVisibilityFields,
  isAccountActive,
  isServiceVisible,
  VisibleUntilFields,
  visibilityFieldsForOwnService,
} from './cleanerVisibility';

/**
 * Required cleaner profile — the ONLY profile requirement for visibility.
 *
 *   Cleaner visible = required profile complete + active subscription
 *
 * This replaced the old Dashboard "profile completion" percentage (50% / 100%),
 * which silently hid paying cleaners until they had also written a description,
 * picked service types and set availability. Those are now optional listing
 * enhancements and never affect visibility.
 *
 * Required fields:
 *   - name      Service / business name (stored in `name`, which is what
 *               customers, chat and invoices already display)
 *   - phone     US number in the app's canonical `+1-XXX-XXX-XXXX` format
 *   - location  Service area: a city + state with coordinates (the coordinates
 *               drive the customer-side distance filter)
 *
 * Where they live:
 *   - `Users/{uid}`            name, phone, serviceLocation   ← source of truth
 *   - `CleanerServices/{uid}`  name, phone, location          ← mirror customers query
 *
 * The customer side evaluates the MIRROR (it is the document it already reads),
 * the cleaner-side routing gate evaluates `Users`. `saveRequiredCleanerProfile`
 * writes both, and `syncRequiredProfileMirror` heals the mirror if it ever
 * lags behind (e.g. the second write failed on a flaky network).
 */

export const US_PHONE_PATTERN = /^\+1-\d{3}-\d{3}-\d{4}$/;

export interface ServiceArea {
  /** Display string, e.g. "Austin, TX". */
  name: string;
  city: string;
  /** Two-letter state code. */
  state: string;
  latitude: number;
  longitude: number;
  placeId?: string | null;
}

export type RequiredProfileField = 'name' | 'phone' | 'location';

export interface RequiredProfileFields {
  name?: string | null;
  phone?: string | null;
  location?: Partial<ServiceArea> | null;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isValidPhone = (phone?: string | null): boolean =>
  typeof phone === 'string' && US_PHONE_PATTERN.test(phone.trim());

export const isValidServiceArea = (
  location?: Partial<ServiceArea> | null,
): location is ServiceArea =>
  !!location &&
  isNonEmptyString(location.city) &&
  isNonEmptyString(location.state) &&
  isFiniteNumber(location.latitude) &&
  isFiniteNumber(location.longitude);

/** Ordered list of what is still missing — drives copy on the gate + admin. */
export const getMissingRequiredFields = (
  fields?: RequiredProfileFields | null,
): RequiredProfileField[] => {
  const missing: RequiredProfileField[] = [];
  if (!isNonEmptyString(fields?.name)) missing.push('name');
  if (!isValidPhone(fields?.phone)) missing.push('phone');
  if (!isValidServiceArea(fields?.location)) missing.push('location');
  return missing;
};

export const hasRequiredCleanerProfile = (
  fields?: RequiredProfileFields | null,
): boolean => getMissingRequiredFields(fields).length === 0;

/** `Users/{uid}` → required fields. */
export const requiredFieldsFromUser = (
  user?: Record<string, any> | null,
): RequiredProfileFields => ({
  name: user?.name ?? null,
  phone: user?.phone ?? null,
  location: user?.serviceLocation ?? null,
});

/** `CleanerServices/{uid}` → required fields. */
export const requiredFieldsFromService = (
  service?: Record<string, any> | null,
): RequiredProfileFields => ({
  name: service?.name ?? null,
  phone: service?.phone ?? null,
  location: service?.location ?? null,
});

export const formatServiceAreaName = (city: string, state: string): string =>
  `${city.trim()}, ${state.trim()}`;

/* ------------------------------------------------------------------ *
 * The visibility rule, whole
 * ------------------------------------------------------------------ */

/**
 * Customer-facing rule evaluated on a `CleanerServices` document — exactly what
 * the customer Home screen and the admin "Live" indicator use.
 */
export const isListingLive = (
  service?: (Record<string, any> & VisibleUntilFields) | null,
  now: number = Date.now(),
): boolean =>
  hasRequiredCleanerProfile(requiredFieldsFromService(service)) &&
  isServiceVisible(service, now);

export type ListingHiddenReason =
  | 'missing_profile'
  | 'no_subscription'
  | 'inactive_account';

export interface ListingStatus {
  live: boolean;
  reason: ListingHiddenReason | null;
  missing: RequiredProfileField[];
}

/**
 * Why a listing is (not) live. Profile is reported first because it is the one
 * thing the cleaner can fix on the spot.
 */
export const describeListingStatus = (
  service?: (Record<string, any> & VisibleUntilFields) | null,
  user?: CleanerVisibilityFields | null,
  now: number = Date.now(),
): ListingStatus => {
  const missing = getMissingRequiredFields(requiredFieldsFromService(service));
  if (user !== undefined && !isAccountActive(user)) {
    return {live: false, reason: 'inactive_account', missing};
  }
  if (missing.length > 0) {
    return {live: false, reason: 'missing_profile', missing};
  }
  if (!isServiceVisible(service, now)) {
    return {live: false, reason: 'no_subscription', missing};
  }
  return {live: true, reason: null, missing};
};

export const REQUIRED_FIELD_LABELS: Record<RequiredProfileField, string> = {
  name: 'Business name',
  phone: 'Phone number',
  location: 'Service location',
};

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

/**
 * Bring `CleanerServices/{uid}` in line with the required fields on `Users`.
 *
 * - Merge write: never clobbers description / images / packages / availability.
 * - Creates the listing document if it doesn't exist yet. That is deliberate —
 *   the payment webhooks update `visibleUntil` with `.update()`, which can only
 *   reach a document that already exists, so a brand-new cleaner needs one
 *   before they subscribe.
 * - Restates `visibleUntil` ONLY when the document has none. Once it exists the
 *   webhooks / reconciliation sweep own it, and a client value derived from a
 *   possibly-stale Users snapshot must not overwrite theirs.
 * - Idempotent: no write when nothing differs.
 *
 * Writes `Users` first and the mirror second (never in one batch): the
 * CleanerServices rule reads the owner's Users document with `get()`, which in a
 * batch sees the PRE-batch state — a brand-new Users doc would not exist yet.
 */
export const syncRequiredProfileMirror = async (
  uid: string,
  user: Record<string, any> | null | undefined,
): Promise<boolean> => {
  if (!uid || !user) return false;
  const required = requiredFieldsFromUser(user);
  if (!hasRequiredCleanerProfile(required)) return false;

  const area = required.location as ServiceArea;
  const ref = firestore().collection('CleanerServices').doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() ?? {} : {};
  const existingLocation = existing.location ?? {};

  const locationMatches =
    existingLocation.city === area.city &&
    existingLocation.state === area.state &&
    existingLocation.latitude === area.latitude &&
    existingLocation.longitude === area.longitude;

  const needsWrite =
    !snap.exists ||
    existing.name !== required.name ||
    existing.phone !== required.phone ||
    !locationMatches ||
    typeof existing.visibleUntil !== 'number' ||
    !existing.createdAt;

  if (!needsWrite) return false;

  await ref.set(
    {
      name: (required.name as string).trim(),
      phone: required.phone,
      location: {
        name: area.name,
        city: area.city,
        state: area.state,
        latitude: area.latitude,
        longitude: area.longitude,
        placeId: area.placeId ?? null,
      },
      ...(existing.image ? {} : {image: user.profile ?? null}),
      ...(existing.createdAt ? {} : {createdAt: new Date()}),
      ...(typeof existing.visibleUntil === 'number'
        ? {}
        : visibilityFieldsForOwnService(user)),
      requiredProfileUpdatedAt: Date.now(),
    },
    {merge: true},
  );
  return true;
};

export interface SaveRequiredProfileInput {
  uid: string;
  name: string;
  phone: string;
  serviceArea: ServiceArea;
  /** Current Users document — needed to derive the initial visibility deadline. */
  user?: Record<string, any> | null;
}

/**
 * Persist the required profile to `Users` then mirror it onto the listing.
 * Throws if the Users write fails; a mirror failure is logged and left for
 * `syncRequiredProfileMirror` (run on Dashboard focus) to heal, because the
 * cleaner has done their part and must not be blocked by it.
 */
export const saveRequiredCleanerProfile = async ({
  uid,
  name,
  phone,
  serviceArea,
  user,
}: SaveRequiredProfileInput): Promise<Record<string, any>> => {
  const fields = {
    name: name.trim(),
    phone: phone.trim(),
    serviceLocation: {
      name: serviceArea.name,
      city: serviceArea.city,
      state: serviceArea.state,
      latitude: serviceArea.latitude,
      longitude: serviceArea.longitude,
      placeId: serviceArea.placeId ?? null,
    },
    requiredProfileUpdatedAt: Date.now(),
  };

  await firestore().collection('Users').doc(uid).set(fields, {merge: true});

  const merged = {...(user ?? {}), ...fields};
  try {
    await syncRequiredProfileMirror(uid, merged);
  } catch (error) {
    console.log('[cleanerProfile] listing mirror write failed:', error);
  }
  return merged;
};
