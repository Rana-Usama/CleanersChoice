/* eslint-env node */
// Uses real Firestore transactions/rules, isolated from the app's Firebase project.
const assert = require('node:assert/strict');
const {test, before, after} = require('node:test');
const {createRequire} = require('node:module');
const functionsRequire = createRequire(require.resolve('../functions/package.json'));
const {initializeApp: initializeAdmin, deleteApp: deleteAdmin} = functionsRequire('firebase-admin/app');
const {getFirestore} = functionsRequire('firebase-admin/firestore');
const {initializeApp, deleteApp} = require('firebase/app');
const {getFirestore: clientFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, getCountFromServer, terminate} = require('firebase/firestore');
const {executeWorkSessionOperation} = require('../functions/lib/workSessions/operations');
const {sweepOverdueWorkSessions, reconcileJobWorkSessions} = require('../functions/lib/workSessions/recovery');
const {DEFAULT_WORK_SESSION_CONFIG, HOUR_MS} = require('../functions/lib/workSessions/model');

const PROJECT = 'demo-cleaners-work';
// This runner deletes fixtures. Refuse any project/host other than the dedicated local demo.
assert.equal(process.env.GCLOUD_PROJECT, PROJECT, 'Run with npm run test:work:emulator');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180', 'Local emulator required');
const admin = initializeAdmin({projectId: PROJECT}, 'work-verification');
const db = getFirestore(admin);
const BASE = Date.UTC(2026, 9, 8, 9);
let now = BASE;
const clients = [];
const config = db.doc('AppConfig/workSessions');
const cleaner = () => ({role: 'Cleaner', name: 'Test Cleaner', phone: '+1-321-659-6898',
  instructionsAccepted: true, instructionsVersionAccepted: 2, defaultHourlyRate: 25,
  serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97},
  subscriptionEndDate: BASE + 30 * 24 * HOUR_MS});
const run = (uid, request) => executeWorkSessionOperation(db, uid, request, () => now);
const start = (uid, requestId, extra = {}) => run(uid, {action: 'clockIn', requestId,
  reportingTimeZone: 'America/New_York', ...extra});
const manual = (uid, requestId, startedAt, endedAt) => run(uid, {action: 'addManual', requestId,
  reportingTimeZone: 'America/New_York', startedAt, endedAt});
const session = async id => (await db.doc(`WorkSessions/${id}`).get()).data();
const seed = async (uid, extra = {}) => db.doc(`Users/${uid}`).set({...cleaner(), ...extra});
const denied = promise => assert.rejects(promise, error => error.code === 'permission-denied');
const rejected = (promise, code) => assert.rejects(promise, error => error.code === code);

function client(uid, claims = {}) {
  const app = initializeApp({projectId: PROJECT, apiKey: 'emulator-only', appId: 'emulator-only'},
    `work-client-${clients.length}`);
  const firestore = clientFirestore(app);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8180,
    uid ? {mockUserToken: {...claims, sub: uid, user_id: uid}} : undefined);
  clients.push({app, firestore});
  return firestore;
}

before(async () => {
  const response = await fetch(`http://127.0.0.1:8180/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    {method: 'DELETE'});
  assert.equal(response.ok, true, 'Could not reset local test database');
  await config.set({...DEFAULT_WORK_SESSION_CONFIG, enabled: true});
});
after(async () => {
  await Promise.all(clients.map(async entry => {
    await terminate(entry.firestore);
    await deleteApp(entry.app);
  }));
  await db.terminate();
  await deleteAdmin(admin);
});

test('real transaction race: only one of two device clock-ins wins', async () => {
  await seed('race');
  const results = await Promise.allSettled([start('race', 'device01'), start('race', 'device02')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const loser = results.find(result => result.status === 'rejected');
  assert.equal(loser.reason.code, 'failed-precondition');
  const records = await db.collection('WorkSessions').where('cleanerId', '==', 'race').get();
  assert.equal(records.size, 1);
  assert.equal((await db.doc('WorkSessionLocks/race').get()).data().activeSessionId, records.docs[0].id);
});

test('simultaneous identical retries create one record and immutable audit event', async () => {
  await seed('retry');
  const results = await Promise.all([start('retry', 'retry001'), start('retry', 'retry001')]);
  assert.deepEqual(results[0], results[1]);
  const id = results[0].sessionId;
  assert.equal((await db.collection(`WorkSessions/${id}/history`).get()).size, 1);
  assert.equal((await db.collection('WorkSessionOperations/retry/requests').get()).size, 1);
  await rejected(start('retry', 'retry001', {note: 'Different payload'}), 'already-exists');
});

test('selected past starts persist, replay exactly and anchor the live timer cap', async () => {
  await seed('past-start');
  const input = {startedAt: BASE - 2 * HOUR_MS, workName: 'Office clean', plannedFinishAt: BASE + HOUR_MS};
  const created = await start('past-start', 'past0001', input);
  assert.deepEqual(await start('past-start', 'past0001', input), created);
  await rejected(start('past-start', 'past0001', {...input, startedAt: BASE - HOUR_MS}), 'already-exists');
  assert.equal((await session(created.sessionId)).startedAt, input.startedAt);
  assert.equal((await session(created.sessionId)).workName, input.workName);
  assert.equal((await session(created.sessionId)).autoStopAt, BASE + 4 * HOUR_MS);
  const audit = await db.doc(`WorkSessions/${created.sessionId}/history/past0001`).get();
  assert.equal(audit.data().after.startedAt, input.startedAt);
  const ownerRecord = await getDoc(doc(client('past-start'), 'WorkSessions', created.sessionId));
  assert.equal(ownerRecord.data().workName, 'Office clean');
  now = BASE + HOUR_MS;
  try {
    await run('past-start', {action: 'clockOut', requestId: 'paststop1', sessionId: created.sessionId});
    assert.equal((await session(created.sessionId)).durationMs, 3 * HOUR_MS);
  } finally {now = BASE;}
});

test('selected live starts cannot overlap confirmed records or exceed the original hard cap', async () => {
  await seed('past-overlap');
  const record = await manual('past-overlap', 'pastmanual', BASE - 2 * HOUR_MS, BASE - HOUR_MS);
  await run('past-overlap', {action: 'confirm', requestId: 'pastconf1', sessionId: record.sessionId,
    startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS});
  await rejected(start('past-overlap', 'pastclash', {startedAt: BASE - 1.5 * HOUR_MS}), 'already-exists');
  await rejected(start('past-overlap', 'future01', {startedAt: BASE + HOUR_MS}), 'invalid-argument');
  await rejected(start('past-overlap', 'oldstart', {startedAt: BASE - 12 * HOUR_MS}), 'invalid-argument');
  await seed('past-cap');
  await rejected(start('past-cap', 'lateend1', {startedAt: BASE - 11 * HOUR_MS,
    plannedFinishAt: BASE + 2 * HOUR_MS}), 'invalid-argument');
  const live = await start('past-cap', 'validcap', {startedAt: BASE - 11 * HOUR_MS});
  assert.equal((await session(live.sessionId)).autoStopAt, BASE + HOUR_MS);
});

test('simultaneous overlapping manual saves cannot both commit', async () => {
  await seed('overlap');
  const results = await Promise.allSettled([
    manual('overlap', 'manual01', BASE - 3 * HOUR_MS, BASE - HOUR_MS),
    manual('overlap', 'manual02', BASE - 2 * HOUR_MS, BASE),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'already-exists');
});

test('two devices editing the same revision cannot silently overwrite each other', async () => {
  await seed('edit');
  const record = await manual('edit', 'manual01', BASE - 2 * HOUR_MS, BASE - HOUR_MS);
  const draft = {action: 'confirm', sessionId: record.sessionId, expectedRevision: 1,
    startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS};
  const results = await Promise.allSettled([
    run('edit', {...draft, requestId: 'confirm1'}), run('edit', {...draft, requestId: 'confirm2'}),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'failed-precondition');
  assert.equal((await session(record.sessionId)).durationMs, HOUR_MS);
  assert.equal((await db.collection(`WorkSessions/${record.sessionId}/history`).get()).size, 2);
});

test('repeated concurrent sweeps stop once at the saved cutoff and never confirm hours', async () => {
  await seed('sweep');
  const record = await start('sweep', 'start001', {plannedFinishAt: BASE + HOUR_MS});
  now = BASE + 5 * HOUR_MS;
  await Promise.all([sweepOverdueWorkSessions(db, () => now, 1), sweepOverdueWorkSessions(db, () => now, 1)]);
  const saved = await session(record.sessionId);
  assert.equal(saved.status, 'needsReview');
  assert.equal(saved.endedAt, BASE + 4 * HOUR_MS);
  assert.equal(saved.durationMs, 0);
  assert.equal((await db.collection(`WorkSessions/${record.sessionId}/history`).get()).size, 2);
  assert.equal((await db.doc(`Notifications/work-session-review-${record.sessionId}`).get()).exists, true);
  await rejected(start('sweep', 'start002'), 'failed-precondition');
  await run('sweep', {action: 'confirm', requestId: 'confirm1', sessionId: record.sessionId,
    startedAt: BASE, endedAt: BASE + 2 * HOUR_MS, expectedRevision: saved.revision});
  assert.equal((await session(record.sessionId)).durationMs, 2 * HOUR_MS);
  now = BASE;
});

test('expiry and disabled feature still permit finish, history and exact receipt replay', async () => {
  await seed('expired');
  const record = await start('expired', 'start001');
  await db.doc('Users/expired').update({subscriptionEndDate: BASE + HOUR_MS / 2});
  await config.update({enabled: false});
  now = BASE + HOUR_MS;
  try {
    const request = {action: 'clockOut', requestId: 'finish01', sessionId: record.sessionId};
    const finished = await run('expired', request);
    assert.equal(finished.status, 'confirmed');
    assert.equal(finished.durationMs, HOUR_MS);
    assert.deepEqual(await run('expired', request), finished);
    await rejected(start('expired', 'start002'), 'failed-precondition');
    assert.equal((await getDoc(doc(client('expired'), `WorkSessions/${record.sessionId}`))).exists(), true);
  } finally {
    now = BASE;
    await config.update({enabled: true});
  }
});

test('delayed job cancellation requires review and cannot undo explicit reviewed hours', async () => {
  await seed('job-cleaner');
  const job = {status: 'confirmed', confirmedCleaner: 'job-cleaner', jobId: 'customer', title: 'House',
    scheduledStartAt: new Date(BASE), expectedHours: 6, budgetType: 'flat'};
  await db.doc('Jobs/test-job').set(job);
  const record = await start('job-cleaner', 'start001', {jobId: 'test-job'});
  now = BASE + 2 * HOUR_MS;
  const canceled = {...job, status: 'cancelled'};
  await db.doc('Jobs/test-job').set(canceled);
  await reconcileJobWorkSessions(db, 'test-job', job, canceled, BASE + HOUR_MS, 'cancel-event', () => now);
  assert.equal((await session(record.sessionId)).status, 'needsReview');
  assert.equal((await session(record.sessionId)).durationMs, 0);
  await run('job-cleaner', {action: 'confirm', requestId: 'confirm1', sessionId: record.sessionId,
    startedAt: BASE, endedAt: BASE + HOUR_MS});
  await reconcileJobWorkSessions(db, 'test-job', job, canceled, BASE + HOUR_MS, 'cancel-event', () => now);
  assert.equal((await session(record.sessionId)).status, 'confirmed');
  assert.equal((await session(record.sessionId)).durationMs, HOUR_MS);
  now = BASE;
});

test('session operations never create or modify collected invoice money', async () => {
  await seed('money');
  const invoice = {cleanerId: 'money', status: 'paid', total: 945, paidAt: BASE};
  await db.doc('Invoices/cash-invoice').set(invoice);
  const record = await manual('money', 'manual01', BASE - HOUR_MS, BASE);
  await run('money', {action: 'confirm', requestId: 'confirm1', sessionId: record.sessionId,
    startedAt: BASE - HOUR_MS, endedAt: BASE});
  assert.deepEqual((await db.doc('Invoices/cash-invoice').get()).data(), invoice);
  assert.equal((await db.collection('Invoices').get()).size, 1);
});

test('deleting a job preserves work for review and repeated events do not duplicate audit', async () => {
  await seed('deleted-job');
  const job = {status: 'confirmed', confirmedCleaner: 'deleted-job', title: 'Deleted house',
    scheduledStartAt: new Date(BASE), expectedHours: 6};
  await db.doc('Jobs/deleted-job').set(job);
  const record = await start('deleted-job', 'start001', {jobId: 'deleted-job'});
  await db.doc('Jobs/deleted-job').delete();
  now = BASE + HOUR_MS;
  await Promise.all([
    reconcileJobWorkSessions(db, 'deleted-job', job, undefined, now, 'delete-event', () => now),
    reconcileJobWorkSessions(db, 'deleted-job', job, undefined, now, 'delete-event', () => now),
  ]);
  const saved = await session(record.sessionId);
  assert.equal(saved.status, 'needsReview');
  assert.equal(saved.stopReason, 'jobDeleted');
  assert.equal(saved.durationMs, 0);
  assert.equal(saved.jobSnapshot.title, 'Deleted house');
  assert.equal((await db.collection(`WorkSessions/${record.sessionId}/history`).get()).size, 2);
  now = BASE;
});

test('manual record limits protect expiry, age, cap and cleaner/customer eligibility', async () => {
  await seed('manual-expired', {subscriptionEndDate: BASE - HOUR_MS});
  await rejected(start('manual-expired', 'start001'), 'permission-denied');
  await rejected(manual('manual-expired', 'manual01', BASE - HOUR_MS, BASE), 'permission-denied');
  const record = await manual('manual-expired', 'manual02', BASE - 2 * HOUR_MS, BASE - HOUR_MS);
  assert.equal(record.status, 'needsReview');
  assert.equal(record.durationMs, 0);
  await run('manual-expired', {action: 'confirm', requestId: 'confirm1', sessionId: record.sessionId,
    startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS});
  await seed('manual-limits');
  await rejected(manual('manual-limits', 'manual01', BASE - 13 * HOUR_MS, BASE), 'invalid-argument');
  await rejected(manual('manual-limits', 'manual02', BASE - 8 * 24 * HOUR_MS, BASE - 8 * 24 * HOUR_MS + HOUR_MS),
    'invalid-argument');
  await seed('not-onboarded', {instructionsAccepted: false});
  await rejected(start('not-onboarded', 'start001'), 'failed-precondition');
  await rejected(manual('not-onboarded', 'manual01', BASE - HOUR_MS, BASE), 'failed-precondition');
  await seed('not-cleaner', {role: 'Customer'});
  await rejected(manual('not-cleaner', 'manual01', BASE - HOUR_MS, BASE), 'permission-denied');
});

test('rules: owner can query history; other cleaner, customer and guest cannot', async () => {
  await seed('reader');
  await seed('other');
  await seed('customer', {role: 'Customer'});
  const record = await manual('reader', 'manual01', BASE - HOUR_MS, BASE);
  const own = client('reader');
  const path = `WorkSessions/${record.sessionId}`;
  assert.equal((await getDoc(doc(own, path))).exists(), true);
  assert.equal((await getDocs(query(collection(own, 'WorkSessions'), where('cleanerId', '==', 'reader')))).size, 1);
  assert.equal((await getDocs(collection(own, `${path}/history`))).size, 1);
  for (const uid of ['other', 'customer', null]) {
    const stranger = client(uid);
    await denied(getDoc(doc(stranger, path)));
    await denied(getDocs(collection(stranger, `${path}/history`)));
    await denied(getDoc(doc(stranger, 'WorkSessionLocks/reader')));
  }
  await denied(getDocs(collection(own, 'WorkSessions')));
});

test('rules: clients cannot forge sessions, locks, receipts, audit or config', async () => {
  const own = client('reader');
  for (const path of ['WorkSessions/forged', 'WorkSessionLocks/reader',
    'WorkSessionOperations/reader/requests/forged01', 'WorkSessions/forged/history/forged01',
    'AppConfig/workSessions']) {
    await denied(setDoc(doc(own, path), {cleanerId: 'reader', status: 'confirmed', durationMs: HOUR_MS}));
  }
  await denied(getDoc(doc(own, 'WorkSessionOperations/reader/requests/manual01')));
  assert.equal((await getDoc(doc(own, 'AppConfig/workSessions'))).data().enabled, true);
});

test('rules: suspended/refunded accounts lose work access while expired accounts retain it', async () => {
  for (const [uid, changes] of [['blocked', {accountStatus: 'suspended'}],
    ['blocked-mixed', {accountStatus: ' Suspended '}],
    ['disabled-mixed', {accountStatus: '\tDISABLED\n'}], ['deleted-mixed', {accountStatus: ' Deleted '}],
    ['refunded', {subscriptionStatus: 'refunded'}], ['lapsed', {subscriptionEndDate: BASE - HOUR_MS}]]) {
    await seed(uid, changes);
    await db.doc(`WorkSessions/${uid}-record`).set({cleanerId: uid, status: 'confirmed'});
    const read = getDoc(doc(client(uid), `WorkSessions/${uid}-record`));
    if (uid === 'lapsed') {
      assert.equal((await read).exists(), true);
    } else {
      await denied(read);
      await rejected(start(uid, 'start001'), 'permission-denied');
    }
  }
});

test('rules: customer invoices and guest browsing keep their existing access', async () => {
  await db.doc('Invoices/customer-invoice').set({cleanerId: 'reader', customerId: 'customer', total: 50});
  const customer = client('customer');
  assert.equal((await getDoc(doc(customer, 'Invoices/customer-invoice'))).exists(), true);
  await denied(getDoc(doc(client('other'), 'Invoices/customer-invoice')));
  await denied(updateDoc(doc(customer, 'Invoices/customer-invoice'), {total: 0}));
  const guest = client(null);
  await db.doc('CleanerServices/reader').set({visibleUntil: Date.now() + HOUR_MS});
  await db.doc('CleanerServices/hidden').set({visibleUntil: 0});
  assert.equal((await getDoc(doc(guest, 'CleanerServices/reader'))).exists(), true);
  assert.equal((await getDoc(doc(guest, 'Users/reader'))).exists(), true);
  await denied(getDoc(doc(guest, 'CleanerServices/hidden')));
});

test('rules: recovery notices allow recipient read flags only and cannot be forged', async () => {
  const own = client('reader');
  const path = 'Notifications/work-session-review-test';
  await db.doc(path).set({toUserId: 'reader', type: 'work_session_review', read: false, sessionId: 'test'});
  await updateDoc(doc(own, path), {read: true});
  await denied(updateDoc(doc(own, path), {sessionId: 'forged'}));
  await denied(updateDoc(doc(own, path), {read: 'true'}));
  await denied(setDoc(doc(own, 'Notifications/work-session-review-forged'), {toUserId: 'reader'}));
  await denied(setDoc(doc(own, 'Notifications/forged'), {toUserId: 'reader', type: 'work_session_review'}));
  await denied(getDoc(doc(client('other'), path)));
});

test('rules: admin service listings require the token claim; active jobs do not', async () => {
  await seed('profile-admin', {admin: true});
  const batch = db.batch();
  for (let index = 0; index < 32; index++) {
    batch.set(db.doc(`CleanerServices/admin-hidden-${index}`), {visibleUntil: 0});
  }
  batch.set(db.doc('Jobs/admin-active-job'), {status: 'active', jobId: 'customer'});
  await batch.commit();

  // Users.admin makes the app show the admin screens but cannot exempt reads.
  const withoutClaim = client('profile-admin');
  await denied(getDocs(collection(withoutClaim, 'CleanerServices')));
  await denied(getCountFromServer(collection(withoutClaim, 'CleanerServices')));
  const jobs = query(collection(withoutClaim, 'Jobs'), where('status', '==', 'active'));
  assert.equal((await getDocs(jobs)).docs.some(entry => entry.id === 'admin-active-job'), true);
  assert.ok((await getCountFromServer(jobs)).data().count >= 1);

  const withClaim = client('profile-admin', {admin: true});
  const services = await getDocs(collection(withClaim, 'CleanerServices'));
  assert.ok(services.size >= 32);
  assert.equal((await getCountFromServer(collection(withClaim, 'CleanerServices'))).data().count, services.size);
  await denied(getDocs(collection(client('other'), 'CleanerServices')));
  // An admin claim does not grant access to another cleaner's work sessions.
  await denied(getDoc(doc(withClaim, 'WorkSessions/lapsed-record')));
});
