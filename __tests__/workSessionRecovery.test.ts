import {executeWorkSessionOperation} from '../functions/src/workSessions/operations';
import {recoverWorkSession, reconcileJobWorkSessions, sweepOverdueWorkSessions}
  from '../functions/src/workSessions/recovery';
import {DEFAULT_WORK_SESSION_CONFIG, HOUR_MS, REQUIRED_INSTRUCTIONS_VERSION, WorkSession}
  from '../functions/src/workSessions/model';
import {Store} from './helpers/workSessionStore';

const BASE = Date.UTC(2026, 9, 7, 9);
let store: Store;
let now: number;
const db = () => store as unknown as Parameters<typeof executeWorkSessionOperation>[0];
const run = (request: any, uid = 'cleaner') => executeWorkSessionOperation(db(), uid, request, () => now);
const start = (extra: any = {}, requestId = 'start001', uid = 'cleaner') => run({
  action: 'clockIn', requestId, reportingTimeZone: 'UTC', ...extra,
}, uid);
const session = (id: string): WorkSession => store.docs.get(`WorkSessions/${id}`);
const lock = () => store.docs.get('WorkSessionLocks/cleaner');
const sweep = (pageSize = 200) => sweepOverdueWorkSessions(db(), () => now, pageSize);
const event = (before: any, after: any, occurredAt: number, eventId = 'job-event-1', pageSize = 200) =>
  reconcileJobWorkSessions(db(), 'job', before, after, occurredAt, eventId, () => now, pageSize);
const originalJob = () => ({
  confirmedCleaner: 'cleaner', status: 'confirmed', title: 'House', jobId: 'customer',
  budgetType: 'hourly', hourlyRate: '30', expectedHours: 6, scheduledStartAt: {toMillis: () => BASE},
});

beforeEach(() => {
  now = BASE;
  store = new Store();
  store.docs.set('Users/cleaner', {
    role: 'Cleaner', subscriptionEndDate: BASE + 24 * HOUR_MS,
    instructionsAccepted: true, instructionsVersionAccepted: REQUIRED_INSTRUCTIONS_VERSION,
    name: 'Cleaner', phone: '+1-321-659-6898', defaultHourlyRate: 25,
    serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97},
  });
  store.docs.set('AppConfig/workSessions', {...DEFAULT_WORK_SESSION_CONFIG, enabled: true});
  store.put('Jobs/job', originalJob(), BASE);
});

it('recovers a dead-phone session at its saved cutoff even when config/account access is gone', async () => {
  const result = await start();
  store.docs.set('AppConfig/workSessions', DEFAULT_WORK_SESSION_CONFIG);
  store.docs.delete('Users/cleaner');
  now += 14 * HOUR_MS;
  expect(await sweep()).toEqual({examined: 1, recovered: 1});
  expect(session(result.sessionId)).toMatchObject({
    status: 'needsReview', endedAt: BASE + 12 * HOUR_MS, durationMs: 0, estimatedDurationMs: 12 * HOUR_MS, revision: 2,
  });
  expect(lock()).toMatchObject({activeSessionId: result.sessionId, reviewSessionIds: [result.sessionId]});
  expect(session(result.sessionId).editHistory[1]).toMatchObject({actorId: 'system', action: 'autoStopped', at: now});
  expect([...store.docs.keys()].filter(path => path.startsWith('Notifications/'))).toHaveLength(1);
  expect(await sweep()).toEqual({examined: 0, recovered: 0});
});

it('honors snapshotted grace rather than a later configuration change', async () => {
  const result = await start({jobId: 'job'});
  store.docs.set('AppConfig/workSessions', {...DEFAULT_WORK_SESSION_CONFIG, enabled: false, graceHours: 1});
  now = BASE + 8 * HOUR_MS;
  expect((await sweep()).recovered).toBe(0);
  now = BASE + 10 * HOUR_MS;
  await sweep();
  expect(session(result.sessionId).endedAt).toBe(BASE + 9 * HOUR_MS);
});

it('paginates changed query results without skipping equal-deadline sessions', async () => {
  const user = store.docs.get('Users/cleaner');
  const ids: string[] = [];
  for (let index = 0; index < 5; index++) {
    const uid = `cleaner${index}`;
    store.docs.set(`Users/${uid}`, user);
    ids.push((await start({}, 'start001', uid)).sessionId);
  }
  now += 14 * HOUR_MS;
  expect(await sweep(2)).toEqual({examined: 5, recovered: 5});
  expect(ids.every(id => session(id).status === 'needsReview')).toBe(true);
});

it('propagates a failed recovery for retry while preserving already recovered sessions', async () => {
  const first = await start();
  store.docs.set('Users/other', store.docs.get('Users/cleaner'));
  const second = await start({}, 'start001', 'other');
  now += 14 * HOUR_MS;
  store.failNextReads.add(`WorkSessions/${first.sessionId}`);
  await expect(sweep()).rejects.toThrow('Temporary read failure');
  expect(session(second.sessionId).status).toBe('needsReview');
  await sweep();
  expect(session(first.sessionId).status).toBe('needsReview');
});

it.each([
  ['completed', {...originalJob(), status: 'completed'}, 'jobCompleted'],
  ['completion requested', {...originalJob(), status: 'pending_completion'}, 'jobCompletionRequested'],
  ['cancelled', {...originalJob(), status: 'active', confirmedCleaner: null}, 'jobAssignmentRemoved'],
  ['reassigned', {...originalJob(), confirmedCleaner: 'other'}, 'jobReassigned'],
  ['deleted', undefined, 'jobDeleted'],
])('stops %s jobs to review using event time instead of delayed execution time', async (_label, after, reason) => {
  const result = await start({jobId: 'job'});
  now = BASE + 5 * HOUR_MS;
  await event(originalJob(), after, BASE + 2 * HOUR_MS);
  expect(session(result.sessionId)).toMatchObject({
    status: 'needsReview', endedAt: BASE + 2 * HOUR_MS, durationMs: 0, stopReason: reason,
    jobSnapshot: {title: 'House'}, paySnapshot: {hourlyRate: 30},
  });
  expect((await event(originalJob(), after, BASE + 2 * HOUR_MS)).recovered).toBe(0);
  expect(session(result.sessionId).editHistory).toHaveLength(2);
});

it('uses the deadline when a later job event occurs after the cap', async () => {
  const result = await start({jobId: 'job'});
  now = BASE + 14 * HOUR_MS;
  await event(originalJob(), undefined, BASE + 13 * HOUR_MS);
  expect(session(result.sessionId)).toMatchObject({endedAt: BASE + 9 * HOUR_MS, stopReason: 'deadline'});
});

it('does not stop sessions for job creation, price/schedule edits, or completion rejection', async () => {
  const result = await start({jobId: 'job'});
  now += HOUR_MS;
  await event(undefined, originalJob(), now);
  await event(originalJob(), {...originalJob(), hourlyRate: '99', expectedHours: 2}, now);
  await event({...originalJob(), status: 'pending_completion'}, originalJob(), now);
  expect(session(result.sessionId).status).toBe('active');
  expect(session(result.sessionId).paySnapshot.hourlyRate).toBe(30);
});

it('shrinks a deadline estimate for an earlier delayed event without duplicating the notice', async () => {
  const result = await start({jobId: 'job'});
  now += 12 * HOUR_MS;
  await sweep();
  await event(originalJob(), undefined, BASE + 2 * HOUR_MS);
  await event(originalJob(), {...originalJob(), status: 'completed'}, BASE + 3 * HOUR_MS, 'later-event');
  expect(session(result.sessionId).endedAt).toBe(BASE + 2 * HOUR_MS);
  expect(session(result.sessionId).editHistory).toHaveLength(3);
  expect([...store.docs.keys()].filter(path => path.startsWith('Notifications/'))).toHaveLength(1);
});

it('preserves explicit review against a delayed event and sweep/clock-out retries', async () => {
  const result = await start({jobId: 'job'});
  now += 12 * HOUR_MS;
  await sweep();
  await run({action: 'confirm', requestId: 'confirm1', sessionId: result.sessionId,
    startedAt: BASE, endedAt: BASE + 4 * HOUR_MS});
  await event(originalJob(), undefined, BASE + 2 * HOUR_MS);
  await sweep();
  expect(session(result.sessionId)).toMatchObject({status: 'confirmed', durationMs: 4 * HOUR_MS});
  expect(lock().reviewSessionIds).toEqual([]);
});

it('handles late events after normal clock-out without replacing a newer active reservation', async () => {
  const result = await start({jobId: 'job'});
  now += 4 * HOUR_MS;
  await run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId});
  const newer = await start({}, 'start002');
  now += HOUR_MS;
  await event(originalJob(), undefined, BASE + 2 * HOUR_MS);
  expect(session(result.sessionId).status).toBe('needsReview');
  expect(session(newer.sessionId).status).toBe('active');
  expect(lock()).toMatchObject({activeSessionId: newer.sessionId, reviewSessionIds: [result.sessionId]});
  await run({action: 'clockOut', requestId: 'finish02', sessionId: newer.sessionId});
  await expect(start({}, 'start003')).rejects.toMatchObject({code: 'failed-precondition'});
  await run({action: 'confirm', requestId: 'confirm1', sessionId: result.sessionId,
    startedAt: BASE, endedAt: BASE + 2 * HOUR_MS});
  await start({}, 'start003');
});

it('ignores out-of-order events from before a newer job-linked start', async () => {
  now += 2 * HOUR_MS;
  const result = await start({jobId: 'job'});
  now += HOUR_MS;
  await event(originalJob(), undefined, BASE + HOUR_MS);
  expect(session(result.sessionId).status).toBe('active');
});

it('uses current job commit time to protect clock-out before the job trigger runs', async () => {
  const result = await start({jobId: 'job'});
  store.put('Jobs/job', {...originalJob(), status: 'completed', updatedAt: 'untrusted'}, BASE + HOUR_MS);
  now += 2 * HOUR_MS;
  expect(await run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId}))
    .toMatchObject({status: 'needsReview', endedAt: BASE + HOUR_MS, durationMs: 0});
  await event(originalJob(), {...originalJob(), status: 'completed'}, BASE + HOUR_MS);
  expect(session(result.sessionId).editHistory).toHaveLength(2);
});

it('reconciliation never confirms active hours, and races safely with the sweep', async () => {
  const result = await start();
  now += HOUR_MS;
  expect(await run({action: 'reconcile', requestId: 'check001', sessionId: result.sessionId}))
    .toMatchObject({status: 'active', durationMs: 0});
  now += 12 * HOUR_MS;
  await Promise.all([
    sweep(), run({action: 'reconcile', requestId: 'check002', sessionId: result.sessionId}),
    run({action: 'clockOut', requestId: 'finish01', sessionId: result.sessionId}),
  ]);
  expect(session(result.sessionId)).toMatchObject({status: 'needsReview', durationMs: 0, endedAt: BASE + 12 * HOUR_MS});
  expect(session(result.sessionId).editHistory).toHaveLength(2);
  expect([...store.docs.keys()].filter(path => path.startsWith('Notifications/'))).toHaveLength(1);
});

it('does not mutate manually supplied times, discarded history, or invoices', async () => {
  const saved = await run({action: 'addManual', requestId: 'manual01', jobId: 'job', reportingTimeZone: 'UTC',
    startedAt: BASE - 2 * HOUR_MS, endedAt: BASE - HOUR_MS});
  const current = await start({jobId: 'job'});
  await run({action: 'discard', requestId: 'discard1', sessionId: current.sessionId});
  now += 14 * HOUR_MS;
  await sweep(); await event(originalJob(), undefined, BASE + HOUR_MS);
  expect(session(saved.sessionId).endedAt).toBe(BASE - HOUR_MS);
  expect(session(current.sessionId).status).toBe('discarded');
  expect([...store.docs.keys()].some(path => /^(Invoices|Payments)\//.test(path))).toBe(false);
});

it('does not recover a future deadline or another job through a direct retry', async () => {
  const result = await start({jobId: 'job'});
  expect(await recoverWorkSession(db(), result.sessionId, {
    reason: 'deadline', occurredAt: BASE + 9 * HOUR_MS, eventId: 'future',
  }, () => now)).toBe(false);
  now += HOUR_MS;
  expect(await recoverWorkSession(db(), result.sessionId, {
    reason: 'jobDeleted', occurredAt: now, eventId: 'other', jobId: 'different',
  }, () => now)).toBe(false);
});
