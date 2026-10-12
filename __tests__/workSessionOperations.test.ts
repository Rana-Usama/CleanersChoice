import {executeWorkSessionOperation} from '../functions/src/workSessions/operations';
import {DEFAULT_WORK_SESSION_CONFIG, HOUR_MS, REQUIRED_INSTRUCTIONS_VERSION, WorkSession}
  from '../functions/src/workSessions/model';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

import {Store, clone} from './helpers/workSessionStore';
import {createHash} from 'node:crypto';

const BASE = Date.UTC(2026, 9, 7, 9);
const cleaner = () => ({
  role: 'Cleaner', subscriptionEndDate: BASE + 30 * 24 * HOUR_MS,
  instructionsAccepted: true, instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
  name: 'Cleaner', phone: '+1-321-659-6898', defaultHourlyRate: 25,
  serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97},
});
let store: Store;
let now: number;
const run = (request: any, uid = 'cleaner') =>
  executeWorkSessionOperation(store as unknown as Parameters<typeof executeWorkSessionOperation>[0], uid, request, () => now);
const start = (requestId = 'start001', extra: any = {}) => run({
  action: 'clockIn', requestId, reportingTimeZone: 'America/New_York', ...extra,
});
const manual = (requestId = 'manual01', extra: any = {}) => run({
  action: 'addManual', requestId, reportingTimeZone: 'America/New_York',
  startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS, ...extra,
});
const session = (id: string): WorkSession => store.docs.get(`WorkSessions/${id}`);
const confirm = (id: string, extra: any = {}) => run({
  action: 'confirm', requestId: 'confirm1', sessionId: id,
  startedAt: session(id).startedAt, endedAt: session(id).endedAt, ...extra,
});

beforeEach(() => {
  now = BASE;
  store = new Store();
  store.docs.set('Users/cleaner', cleaner());
  store.docs.set('AppConfig/workSessions', {...DEFAULT_WORK_SESSION_CONFIG, enabled: true});
});

it('saves a named timer and preserves its name through clock-out and receipt replay', async () => {
  const result = await start('named001', {workName: '  Office deep clean  ', plannedFinishAt: BASE + 2 * HOUR_MS});
  expect(session(result.sessionId)).toMatchObject({workName: 'Office deep clean', startedAt: BASE,
    expectedEndAt: BASE + 2 * HOUR_MS, durationMs: 0, jobId: null, jobSnapshot: null});
  expect(await start('named001', {workName: '  Office deep clean  ', plannedFinishAt: BASE + 2 * HOUR_MS})).toEqual(result);
  await expect(start('named001', {workName: 'Different work', plannedFinishAt: BASE + 2 * HOUR_MS}))
    .rejects.toMatchObject({code: 'already-exists'});
  now += HOUR_MS;
  await run({action: 'clockOut', requestId: 'stopname1', sessionId: result.sessionId});
  expect(session(result.sessionId)).toMatchObject({workName: 'Office deep clean', status: 'confirmed', durationMs: HOUR_MS});
});

it('preserves the receipt hash used by already queued unnamed starts', async () => {
  const result = await start();
  const oldHash = createHash('sha256').update(JSON.stringify({action: 'clockIn', sessionId: null, jobId: null,
    reportingTimeZone: 'America/New_York', plannedFinishAt: null, startedAt: null, endedAt: null, note: ''})).digest('hex');
  expect(store.docs.get('WorkSessionOperations/cleaner/requests/start001').requestHash).toBe(oldHash);
  expect(await start()).toEqual(result);
  expect(session(result.sessionId).workName).toBeUndefined();
});

it('saves the selected past start, anchors recovery to it and counts hours from it at clock-out', async () => {
  const selectedStart = BASE - 2 * HOUR_MS;
  const result = await start('past0001', {startedAt: selectedStart, plannedFinishAt: BASE + HOUR_MS});
  expect(session(result.sessionId)).toMatchObject({startedAt: selectedStart, expectedEndAt: BASE + HOUR_MS,
    autoStopAt: BASE + 4 * HOUR_MS, durationMs: 0, status: 'active'});
  expect(session(result.sessionId).editHistory[0].after.startedAt).toBe(selectedStart);
  expect(await start('past0001', {startedAt: selectedStart, plannedFinishAt: BASE + HOUR_MS})).toEqual(result);
  await expect(start('past0001', {startedAt: BASE - HOUR_MS, plannedFinishAt: BASE + HOUR_MS}))
    .rejects.toMatchObject({code: 'already-exists'});
  now += HOUR_MS;
  await run({action: 'clockOut', requestId: 'paststop1', sessionId: result.sessionId});
  expect(session(result.sessionId)).toMatchObject({durationMs: 3 * HOUR_MS, status: 'confirmed'});
});

it.each([
  {startedAt: BASE + 60000}, {startedAt: BASE - 12 * HOUR_MS},
  {startedAt: BASE - 13 * HOUR_MS}, {startedAt: BASE, endedAt: BASE + HOUR_MS},
  {startedAt: BASE - 2 * HOUR_MS, plannedFinishAt: BASE - HOUR_MS},
  {startedAt: BASE - 11 * HOUR_MS, plannedFinishAt: BASE + 2 * HOUR_MS},
])('rejects invalid live starts or ends without creating a timer: %p', async input => {
  await expect(start('badpast1', input)).rejects.toMatchObject({code: 'invalid-argument'});
  expect([...store.docs.keys()].filter(path => /^WorkSessions\/[^/]+$/.test(path))).toHaveLength(0);
});

it('checks overlap across the selected past start, including already confirmed work', async () => {
  const record = await manual();
  await confirm(record.sessionId);
  await expect(start('overlap1', {startedAt: BASE - 1.5 * HOUR_MS})).rejects.toMatchObject({code: 'already-exists'});
});

it('keeps the hard cap anchored to a past start with no planned end', async () => {
  const result = await start('pastcap1', {startedAt: BASE - 11 * HOUR_MS});
  expect(session(result.sessionId)).toMatchObject({startedAt: BASE - 11 * HOUR_MS, autoStopAt: BASE + HOUR_MS});
});

it.each(['', '   ', 'x'.repeat(121), 123])('rejects invalid work names without creating a timer: %p', async workName => {
  await expect(start('badname1', {workName})).rejects.toMatchObject({code: 'invalid-argument'});
  expect([...store.docs.keys()].filter(path => /^WorkSessions\/[^/]+$/.test(path))).toHaveLength(0);
});

it('protects linked job titles and prevents renaming an existing record through a time update', async () => {
  store.docs.set('Jobs/job', {status: 'confirmed', confirmedCleaner: 'cleaner', title: 'House',
    scheduledStartAt: {toMillis: () => BASE}, expectedHours: 2});
  await expect(start('jobname1', {jobId: 'job', workName: 'Override'})).rejects.toThrow('unlinked work');
  const result = await start('jobname2', {jobId: 'job'});
  expect(session(result.sessionId).jobSnapshot?.title).toBe('House');
  await expect(run({action: 'clockOut', requestId: 'rename01', sessionId: result.sessionId, workName: 'Override'}))
    .rejects.toMatchObject({code: 'invalid-argument'});
});

it('rejects stale confirmations and same-millisecond corrections, but replays the original receipt', async () => {
  const created = await manual();
  expect(created.revision).toBe(1);
  const confirmed = await confirm(created.sessionId, {expectedRevision: 1});
  expect(confirmed.revision).toBe(2);
  await expect(confirm(created.sessionId, {requestId: 'stale001', expectedRevision: 1})).rejects.toThrow('changed while');
  const correction = {action: 'edit', requestId: 'edit0001', sessionId: created.sessionId,
    startedAt: BASE - 3 * HOUR_MS, endedAt: BASE - HOUR_MS, expectedRevision: 2, note: 'Earlier start'};
  const corrected = await run(correction);
  expect(corrected.revision).toBe(3);
  await expect(run({...correction, requestId: 'edit0002'})).rejects.toThrow('changed while');
  await expect(run({action: 'discard', requestId: 'discard1', sessionId: created.sessionId, expectedRevision: 2})).rejects.toThrow('changed while');
  expect(await run(correction)).toEqual(corrected);
  expect(session(created.sessionId).editHistory).toHaveLength(3);
  expect(store.docs.get(`WorkSessions/${created.sessionId}/history/manual01`).after.startedAt).toBe(BASE - 2 * HOUR_MS);
});

it('accepts revision zero for legacy records and preserves their original history', async () => {
  const created = await manual();
  const legacy = clone(session(created.sessionId));
  delete legacy.revision;
  store.docs.set(`WorkSessions/${created.sessionId}`, legacy);
  expect((await confirm(created.sessionId, {expectedRevision: 0})).revision).toBe(1);
  expect(session(created.sessionId).editHistory).toHaveLength(2);
});

it('keeps the server onboarding requirement aligned with the app', () => {
  expect(REQUIRED_INSTRUCTIONS_VERSION).toBe(CLEANER_INSTRUCTIONS_VERSION);
});

it('requests actual-time review without confirming hours and preserves the slot until explicit resolution', async () => {
  const started = await start();
  now += 2 * HOUR_MS;
  const request = {action: 'requestReview', requestId: 'review001', sessionId: started.sessionId};
  expect(await run(request)).toMatchObject({status: 'needsReview', durationMs: 0});
  await expect(start('start002')).rejects.toThrow('review');
  expect(await run(request)).toMatchObject({status: 'needsReview', durationMs: 0});
  const actualEnd = now - HOUR_MS;
  expect(await confirm(started.sessionId, {endedAt: actualEnd})).toMatchObject({status: 'confirmed', durationMs: HOUR_MS});
  expect(session(started.sessionId).editHistory.map(event => event.action)).toEqual(['clockIn', 'requestReview', 'confirm']);
});

it('adds a planned finish to running general work without extending its cap or using later config', async () => {
  const started = await start();
  now += HOUR_MS;
  store.docs.set('AppConfig/workSessions', {...DEFAULT_WORK_SESSION_CONFIG, graceHours: 1});
  await run({action: 'setPlannedFinish', requestId: 'planned01', sessionId: started.sessionId, plannedFinishAt: BASE + 4 * HOUR_MS});
  expect(session(started.sessionId)).toMatchObject({expectedEndAt: BASE + 4 * HOUR_MS, autoStopAt: BASE + 7 * HOUR_MS, status: 'active', durationMs: 0});
  await expect(run({action: 'setPlannedFinish', requestId: 'planned02', sessionId: started.sessionId, plannedFinishAt: BASE + 5 * HOUR_MS})).rejects.toThrow('general work');
});

it('rejects an optional planned finish after the cap and past/future-invalid changes', async () => {
  const started = await start();
  for (const plannedFinishAt of [BASE, BASE + 13 * HOUR_MS]) {
    await expect(run({action: 'setPlannedFinish', requestId: 'planned01', sessionId: started.sessionId, plannedFinishAt})).rejects.toThrow('future finish');
  }
  now += 13 * HOUR_MS;
  await expect(run({action: 'setPlannedFinish', requestId: 'planned01', sessionId: started.sessionId, plannedFinishAt: now + HOUR_MS})).rejects.toThrow('general work');
});

it('allows only one of two simultaneous device starts', async () => {
  const results = await Promise.allSettled([start('device01'), start('device02')]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect([...store.docs.keys()].filter(path => /^WorkSessions\/[^/]+$/.test(path))).toHaveLength(1);
});

it('replays a successful start even after the feature is disabled; changed payloads cannot reuse its ID', async () => {
  const original = await start();
  now += HOUR_MS;
  store.docs.set('AppConfig/workSessions', DEFAULT_WORK_SESSION_CONFIG);
  expect(await start()).toEqual(original);
  await expect(start('start001', {note: 'changed'})).rejects.toMatchObject({code: 'already-exists'});
  expect(session(original.sessionId).editHistory).toHaveLength(1);
});

it.each([undefined, {enabled: true}, DEFAULT_WORK_SESSION_CONFIG])('blocks new work with unavailable config: %p', async config => {
  store.docs.set('AppConfig/workSessions', config);
  await expect(start()).rejects.toMatchObject({code: 'failed-precondition'});
  await expect(manual()).rejects.toMatchObject({code: 'failed-precondition'});
});

it.each([
  {role: 'Customer'}, {accountStatus: 'suspended'}, {subscriptionStatus: 'refunded'},
  {subscriptionEndDate: BASE}, {instructionsAccepted: false}, {serviceLocation: {}},
])('rejects new work without cleaner eligibility: %p', async changes => {
  store.docs.set('Users/cleaner', {...cleaner(), ...changes});
  await expect(start()).rejects.toThrow();
});

it('snapshots job expected end and hourly rate instead of extending them from a late clock-in', async () => {
  now = BASE + 4 * 60000;
  store.docs.set('Jobs/job', {
    status: 'confirmed', confirmedCleaner: 'cleaner', jobId: 'customer', title: 'House',
    scheduledStartAt: {toMillis: () => BASE}, expectedHours: 6, budgetType: 'hourly', hourlyRate: '40',
  });
  const result = await start('start001', {jobId: 'job'});
  expect(session(result.sessionId)).toMatchObject({
    expectedEndAt: BASE + 6 * HOUR_MS, autoStopAt: BASE + 9 * HOUR_MS,
    paySnapshot: {hourlyRate: 40, rateSource: 'job'},
  });
  store.docs.get('Jobs/job').hourlyRate = '99';
  now += HOUR_MS;
  await run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId});
  expect(session(result.sessionId).paySnapshot.hourlyRate).toBe(40);
});

it('does not invent an hourly wage for fixed jobs', async () => {
  store.docs.set('Jobs/job', {status: 'confirmed', confirmedCleaner: 'cleaner', title: 'House',
    scheduledStartAt: {toMillis: () => BASE}, expectedHours: 6, budgetType: 'flat', hourlyRate: '99'});
  const result = await start('start001', {jobId: 'job'});
  expect(session(result.sessionId).paySnapshot).toMatchObject({basis: 'flat', hourlyRate: null, rateSource: 'unavailable'});
});

it('requires a real assignment and normalized duration on job-linked starts', async () => {
  store.docs.set('Jobs/job', {status: 'confirmed', confirmedCleaner: 'someoneElse'});
  await expect(start('start001', {jobId: 'job'})).rejects.toMatchObject({code: 'permission-denied'});
  store.docs.get('Jobs/job').confirmedCleaner = 'cleaner';
  await expect(start('start002', {jobId: 'job'})).rejects.toMatchObject({code: 'failed-precondition'});
});

it('handles general work with a cap, optional finish, and default rate', async () => {
  const result = await start('start001', {plannedFinishAt: BASE + 2 * HOUR_MS});
  expect(session(result.sessionId)).toMatchObject({
    expectedEndAt: BASE + 2 * HOUR_MS, autoStopAt: BASE + 5 * HOUR_MS,
    paySnapshot: {basis: 'general', hourlyRate: 25, rateSource: 'cleanerDefault'},
  });
});

it('requires an explicit revised finish when the scheduled grace already elapsed', async () => {
  store.docs.set('Jobs/job', {status: 'confirmed', confirmedCleaner: 'cleaner',
    scheduledStartAt: {toMillis: () => BASE - 10 * HOUR_MS}, expectedHours: 6});
  await expect(start('start001', {jobId: 'job'})).rejects.toMatchObject({code: 'failed-precondition'});
  const result = await start('start002', {jobId: 'job', plannedFinishAt: BASE + HOUR_MS});
  expect(session(result.sessionId).expectedEndAt).toBe(BASE + HOUR_MS);
});

it('allows clock-out after expiry/disable, using server time and counting once', async () => {
  const result = await start();
  store.docs.get('Users/cleaner').subscriptionEndDate = BASE + 30 * 60000;
  store.docs.set('AppConfig/workSessions', DEFAULT_WORK_SESSION_CONFIG);
  now += HOUR_MS;
  const finished = await run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId});
  expect(finished).toMatchObject({status: 'confirmed', durationMs: HOUR_MS, endedAt: now});
  expect(await run({action: 'clockOut', requestId: 'finish02', sessionId: result.sessionId})).toEqual(finished);
  expect(session(result.sessionId).editHistory).toHaveLength(2);
  expect(store.docs.get('WorkSessionLocks/cleaner').activeSessionId).toBeNull();
});

it('leaves late clock-outs pending until corrected, preserving the original cutoff', async () => {
  const result = await start();
  now += 14 * HOUR_MS;
  expect(await run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId}))
    .toMatchObject({status: 'needsReview', durationMs: 0, endedAt: BASE + 12 * HOUR_MS});
  await expect(start('start002')).rejects.toMatchObject({code: 'failed-precondition'});
  expect(await confirm(result.sessionId, {endedAt: BASE + 6 * HOUR_MS})).toMatchObject({
    status: 'confirmed', durationMs: 6 * HOUR_MS,
  });
  expect(session(result.sessionId).source).toBe('clock');
  expect(store.docs.get('WorkSessionLocks/cleaner').activeSessionId).toBeNull();
  await start('start003');
});

it('manual Save remains pending; confirmation remains possible after feature disable', async () => {
  const saved = await manual();
  expect(saved).toMatchObject({status: 'needsReview', durationMs: 0});
  expect(session(saved.sessionId).source).toBe('manualCleaner');
  store.docs.set('AppConfig/workSessions', DEFAULT_WORK_SESSION_CONFIG);
  const confirmed = await confirm(saved.sessionId);
  expect(confirmed).toMatchObject({status: 'confirmed', durationMs: HOUR_MS});
  expect(await confirm(saved.sessionId)).toEqual(confirmed);
});

it('serializes conflicting manual writes and permits adjacent intervals', async () => {
  const requests = await Promise.allSettled([manual('manual01'), manual('manual02')]);
  expect(requests.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  await manual('manual03', {startedAt: BASE - HOUR_MS, endedAt: BASE});
});

it('prevents overlap with active work and rejects edits which collide with history', async () => {
  const saved = await manual();
  await confirm(saved.sessionId);
  const current = await start();
  now += HOUR_MS;
  await expect(manual('manual02', {startedAt: BASE, endedAt: now})).rejects.toMatchObject({code: 'already-exists'});
  await run({action: 'clockOut', requestId: 'finish01', sessionId: current.sessionId});
  await expect(run({action: 'edit', requestId: 'editing1', sessionId: saved.sessionId,
    startedAt: BASE - HOUR_MS, endedAt: now})).rejects.toMatchObject({code: 'already-exists'});
});

it.each([
  {startedAt: BASE, endedAt: BASE},
  {startedAt: BASE, endedAt: BASE + HOUR_MS},
  {startedAt: BASE - 13 * HOUR_MS, endedAt: BASE},
  {startedAt: BASE - 8 * 24 * HOUR_MS, endedAt: BASE - 8 * 24 * HOUR_MS + HOUR_MS},
])('rejects invalid or old manual intervals: %p', async times => {
  await expect(manual('manual01', times)).rejects.toMatchObject({code: 'invalid-argument'});
});

it('limits lapsed cleaner manual work to recorded entitlement, including later edits', async () => {
  store.docs.get('Users/cleaner').subscriptionEndDate = BASE - HOUR_MS;
  const saved = await manual();
  await expect(manual('manual02', {startedAt: BASE - HOUR_MS, endedAt: BASE})).rejects.toMatchObject({code: 'permission-denied'});
  await expect(confirm(saved.sessionId, {endedAt: BASE})).rejects.toMatchObject({code: 'permission-denied'});
  await confirm(saved.sessionId);
});

it('rejects cross-cleaner operations and fabricated server-owned fields', async () => {
  const result = await start();
  store.docs.set('Users/other', cleaner());
  await expect(run({action: 'discard', requestId: 'discard1', sessionId: result.sessionId}, 'other'))
    .rejects.toMatchObject({code: 'permission-denied'});
  await expect(start('start002', {status: 'confirmed', cleanerId: 'other'}))
    .rejects.toMatchObject({code: 'invalid-argument'});
  await expect(run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId, endedAt: now}))
    .rejects.toMatchObject({code: 'invalid-argument'});
});

it('retains discarded history, releases the active slot, and ignores it for overlap', async () => {
  const saved = await manual();
  await confirm(saved.sessionId);
  const discarded = await run({action: 'discard', requestId: 'discard1', sessionId: saved.sessionId, note: 'Did not work'});
  expect(discarded).toMatchObject({status: 'discarded', durationMs: 0});
  expect(session(saved.sessionId).editHistory).toHaveLength(3);
  await manual('manual02');
  const active = await start();
  await run({action: 'discard', requestId: 'discard2', sessionId: active.sessionId});
  await start('start002');
});

it('keeps full immutable audit history while bounding the inline preview', async () => {
  const saved = await manual();
  await confirm(saved.sessionId);
  for (let index = 0; index < 25; index++) {
    await run({action: 'edit', requestId: `editing${index}`, sessionId: saved.sessionId,
      startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS, note: `Correction ${index}`});
  }
  expect(session(saved.sessionId).editHistory).toHaveLength(20);
  expect([...store.docs.keys()].filter(path => path.startsWith(`WorkSessions/${saved.sessionId}/history/`))).toHaveLength(27);
});

it('does not touch jobs, invoices, payments or subscription fields', async () => {
  const userBefore = clone(store.docs.get('Users/cleaner'));
  const saved = await manual();
  await confirm(saved.sessionId);
  expect(store.docs.get('Users/cleaner')).toEqual(userBefore);
  expect([...store.docs.keys()].some(path => /^(Jobs|Invoices|Payments)\//.test(path))).toBe(false);
});

it('stores total earnings, audits revisions and edits money without changing active timer deadlines', async () => {
  const created = await start('earning1', {expectedEarnings: 125.50});
  const original = session(created.sessionId);
  const input = {action: 'editEarnings', requestId: 'earning2', sessionId: created.sessionId,
    expectedEarnings: 140.25, expectedRevision: 1};
  const updated = await run(input);
  expect(session(created.sessionId)).toMatchObject({expectedEarnings: 140.25, revision: 2,
    status: 'active', startedAt: original.startedAt, endedAt: null, autoStopAt: original.autoStopAt,
    expectedEndAt: original.expectedEndAt, durationMs: 0});
  expect(session(created.sessionId).editHistory.slice(-1)[0]).toMatchObject({action: 'editEarnings',
    beforeExpectedEarnings: 125.50, afterExpectedEarnings: 140.25});
  expect(await run(input)).toEqual(updated);
  await expect(run({...input, expectedEarnings: 200})).rejects.toMatchObject({code: 'already-exists'});
  await expect(run({...input, requestId: 'earning3'})).rejects.toMatchObject({code: 'failed-precondition'});
  now += HOUR_MS;
  await run({action: 'clockOut', requestId: 'earning4', sessionId: created.sessionId});
  store.docs.set('Users/cleaner', {...cleaner(), subscriptionEndDate: BASE - 1});
  await run({...input, requestId: 'earning5', expectedRevision: 3, expectedEarnings: 0});
  expect(session(created.sessionId)).toMatchObject({expectedEarnings: 0, durationMs: HOUR_MS, status: 'confirmed'});
});

it('lets a pending manual general record receive an amount and retains it through confirmation', async () => {
  const record = await manual('earning6', {expectedEarnings: 0.29});
  await run({action: 'editEarnings', requestId: 'earning7', sessionId: record.sessionId,
    expectedRevision: 1, expectedEarnings: 60});
  expect(session(record.sessionId).status).toBe('needsReview');
  await confirm(record.sessionId);
  expect(session(record.sessionId)).toMatchObject({expectedEarnings: 60, status: 'confirmed'});
});

it.each([-1, 1.001, 1000001, NaN, Infinity, '100', null])('rejects invalid total earnings: %p', async amount => {
  await expect(start('badmoney', {expectedEarnings: amount})).rejects.toMatchObject({code: 'invalid-argument'});
});

it('requires a revision, refuses time overrides, linked job amounts, discarded records and other owners', async () => {
  const record = await start('earning8');
  const input = {action: 'editEarnings', requestId: 'earning9', sessionId: record.sessionId, expectedEarnings: 50};
  await expect(run(input)).rejects.toMatchObject({code: 'invalid-argument'});
  await expect(run({...input, expectedRevision: 1, startedAt: BASE})).rejects.toMatchObject({code: 'invalid-argument'});
  await expect(run({action: 'clockOut', requestId: 'money001', sessionId: record.sessionId, expectedEarnings: 50}))
    .rejects.toMatchObject({code: 'invalid-argument'});
  await run({action: 'discard', requestId: 'money002', sessionId: record.sessionId});
  await expect(run({...input, expectedRevision: 2})).rejects.toMatchObject({code: 'failed-precondition'});
  store.docs.set('Jobs/job', {status: 'confirmed', confirmedCleaner: 'cleaner', title: 'House',
    scheduledStartAt: {toMillis: () => BASE}, expectedHours: 2});
  await expect(start('money003', {jobId: 'job', expectedEarnings: 50})).rejects.toMatchObject({code: 'invalid-argument'});
  const linked = await start('money004', {jobId: 'job'});
  await expect(run({...input, sessionId: linked.sessionId, expectedRevision: 1}))
    .rejects.toMatchObject({code: 'failed-precondition'});
  session(linked.sessionId).cleanerId = 'other';
  await expect(run({...input, sessionId: linked.sessionId, expectedRevision: 1}))
    .rejects.toMatchObject({code: 'permission-denied'});
});
