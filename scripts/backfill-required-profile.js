#!/usr/bin/env node
/**
 * Backfill for the new cleaner visibility rule:
 *
 *   visible = required profile (name + phone + service city/state) + active subscription
 *
 * The app now evaluates the required profile on the `CleanerServices` document
 * customers query (name, phone, location.city/state + coordinates). Existing
 * listings pre-date that: none carry `phone`, and many only have a formatted
 * street address in `location.name` with no structured city/state. Without this
 * backfill, every existing listing disappears from the customer side the moment
 * the new build ships, until each cleaner opens the app and passes the
 * "Complete your business info" screen.
 *
 * What it does, per cleaner (role == 'Cleaner'):
 *   - CleanerServices.phone           ← Users.phone, when it is a valid US number
 *   - CleanerServices.name            ← Users.name, when the listing has none
 *   - CleanerServices.location.city/state ← parsed from the existing listing
 *     address, when it can be read confidently (coordinates are kept as-is)
 *   - Users.serviceLocation           ← the same city/state + coordinates, so the
 *     in-app gate (which reads Users) agrees with the customer side
 *   It never touches visibleUntil, subscriptions, or optional listing details.
 *
 * Read-only unless --commit. Always prints the before/after visibility impact.
 *
 *   node --env-file=../cleanerChoiceServer/CleanersChoice-Server/.env \
 *        ./scripts/backfill-required-profile.js            # dry run
 *   node --env-file=... ./scripts/backfill-required-profile.js --commit
 *   add --verbose to list every cleaner who stays hidden and why
 *
 * Credentials: PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY (server .env format), or
 * GOOGLE_APPLICATION_CREDENTIALS. `firebase-admin` comes from functions/node_modules.
 *
 * Keep the predicate in step with src/utils/cleanerProfile.ts.
 */

const path = require('path');

const admin = require(path.join(
  __dirname,
  '..',
  'functions',
  'node_modules',
  'firebase-admin',
));

const COMMIT = process.argv.includes('--commit');
const VERBOSE = process.argv.includes('--verbose');
const READ_CHUNK = 200;
const WRITE_BATCH = 400;

const {GOOGLE_APPLICATION_CREDENTIALS, PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY} =
  process.env;

if (!GOOGLE_APPLICATION_CREDENTIALS && !(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY)) {
  console.error(
    'No Firebase credentials. Set PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY (e.g. via\n' +
      '--env-file=<server repo>/.env) or GOOGLE_APPLICATION_CREDENTIALS.',
  );
  process.exit(1);
}

admin.initializeApp(
  GOOGLE_APPLICATION_CREDENTIALS
    ? {credential: admin.credential.applicationDefault()}
    : {
        credential: admin.credential.cert({
          projectId: PROJECT_ID,
          clientEmail: CLIENT_EMAIL,
          privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      },
);
const db = admin.firestore();

/* ---------------- predicate (mirror of src/utils/cleanerProfile.ts) -------- */

const US_PHONE = /^\+1-\d{3}-\d{3}-\d{4}$/;
const STATE_SEGMENT = /^([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/;

const nonEmpty = v => typeof v === 'string' && v.trim().length > 0;
const finite = v => typeof v === 'number' && Number.isFinite(v);
const validPhone = v => typeof v === 'string' && US_PHONE.test(v.trim());
const validArea = l =>
  !!l && nonEmpty(l.city) && nonEmpty(l.state) && finite(l.latitude) && finite(l.longitude);

const missingFields = ({name, phone, location}) => {
  const m = [];
  if (!nonEmpty(name)) m.push('name');
  if (!validPhone(phone)) m.push('phone');
  if (!validArea(location)) m.push('location');
  return m;
};

/** Same conservative parser as src/utils/locationFormat.ts. */
const parseCityState = address => {
  if (!nonEmpty(address)) return {city: null, state: null};
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const match = parts[i].match(STATE_SEGMENT);
    if (match) return {city: parts[i - 1] || null, state: match[1]};
  }
  return {city: null, state: null};
};

const areaFromListing = loc => {
  if (!loc || !finite(loc.latitude) || !finite(loc.longitude)) return null;
  const structured = nonEmpty(loc.city) && nonEmpty(loc.state);
  const {city, state} = structured ? {city: loc.city, state: loc.state} : parseCityState(loc.name);
  if (!city || !state) return null;
  return {
    name: `${city.trim()}, ${state.trim()}`,
    city: city.trim(),
    state: state.trim(),
    latitude: loc.latitude,
    longitude: loc.longitude,
    placeId: loc.placeId ?? null,
  };
};

/* ---------------- run ---------------------------------------------------- */

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

(async () => {
  const now = Date.now();
  console.log(`Mode: ${COMMIT ? 'COMMIT' : 'dry run'} — project ${PROJECT_ID || '(ADC)'}`);

  const usersSnap = await db.collection('Users').where('role', '==', 'Cleaner').get();
  const users = usersSnap.docs;
  console.log(`Cleaners: ${users.length}`);

  const services = new Map();
  for (const ids of chunk(users.map(d => d.id), READ_CHUNK)) {
    const snaps = await db.getAll(...ids.map(id => db.collection('CleanerServices').doc(id)));
    snaps.forEach(s => s.exists && services.set(s.id, s.data()));
  }

  const stats = {
    withListing: 0,
    subscribedWithListing: 0,
    liveBefore_oldRule: 0,
    liveAfter: 0,
    serviceWrites: 0,
    userWrites: 0,
    hiddenReasons: {phone: 0, location: 0, name: 0},
  };
  const stillHidden = [];
  const writes = [];

  for (const userDoc of users) {
    const uid = userDoc.id;
    const user = userDoc.data() || {};
    const svc = services.get(uid);
    if (!svc) continue;
    stats.withListing++;

    const subscribed = finite(svc.visibleUntil) && svc.visibleUntil > now;
    if (subscribed) stats.subscribedWithListing++;

    // Old rule, for comparison: the Home completeness filter + visibleUntil.
    if (
      subscribed && svc.createdAt && svc.name && svc.description &&
      svc.availability && svc.type && svc.location
    ) {
      stats.liveBefore_oldRule++;
    }

    const area = validArea(user.serviceLocation)
      ? user.serviceLocation
      : areaFromListing(svc.location);

    const svcPatch = {};
    if (validPhone(user.phone) && svc.phone !== user.phone) svcPatch.phone = user.phone.trim();
    if (!nonEmpty(svc.name) && nonEmpty(user.name)) svcPatch.name = user.name.trim();
    if (area && !(nonEmpty(svc.location?.city) && nonEmpty(svc.location?.state))) {
      svcPatch['location.city'] = area.city;
      svcPatch['location.state'] = area.state;
    }

    const userPatch = {};
    if (area && !validArea(user.serviceLocation)) userPatch.serviceLocation = area;

    if (Object.keys(svcPatch).length) {
      writes.push({ref: db.collection('CleanerServices').doc(uid), data: svcPatch});
      stats.serviceWrites++;
    }
    if (Object.keys(userPatch).length) {
      writes.push({ref: db.collection('Users').doc(uid), data: userPatch});
      stats.userWrites++;
    }

    // Projected state after the backfill.
    const after = {
      name: svcPatch.name ?? svc.name,
      phone: svcPatch.phone ?? svc.phone,
      location: area
        ? {...svc.location, city: area.city, state: area.state}
        : svc.location,
    };
    const missing = missingFields(after);
    if (subscribed && missing.length === 0) stats.liveAfter++;
    if (subscribed && missing.length) {
      missing.forEach(f => stats.hiddenReasons[f]++);
      stillHidden.push({uid, email: user.email ?? '', missing});
    }
  }

  console.log('\n— Impact (cleaners with a listing) —');
  console.log(`Listings:                          ${stats.withListing}`);
  console.log(`  with an active subscription:     ${stats.subscribedWithListing}`);
  console.log(`  visible today (old % rule):      ${stats.liveBefore_oldRule}`);
  console.log(`  visible after backfill (new):    ${stats.liveAfter}`);
  console.log(
    `  subscribed but still hidden:     ${stillHidden.length} ` +
      `(missing phone ${stats.hiddenReasons.phone}, location ${stats.hiddenReasons.location}, name ${stats.hiddenReasons.name})`,
  );
  console.log('  → these see the "Complete your business info" screen on next app open.');
  console.log(`\nWrites planned: ${stats.serviceWrites} CleanerServices, ${stats.userWrites} Users`);

  if (VERBOSE && stillHidden.length) {
    console.log('\nSubscribed but still hidden:');
    stillHidden.forEach(r => console.log(`  ${r.uid}  ${r.email}  missing: ${r.missing.join(', ')}`));
  }

  if (!COMMIT) {
    console.log('\nDry run — nothing written. Re-run with --commit to apply.');
    return;
  }

  for (const group of chunk(writes, WRITE_BATCH)) {
    const batch = db.batch();
    group.forEach(w => batch.update(w.ref, w.data));
    await batch.commit();
  }
  console.log(`\nCommitted ${writes.length} writes.`);
})().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
