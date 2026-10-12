import {addedJobApplicants, storeApplicationNotification} from '../functions/src/jobs/applicationNotifications';
import {Store} from './helpers/workSessionStore';

let store: Store;
const job = (applicants: string[], version: number, extra: any = {}) =>
  store.put('Jobs/job', {jobId: 'customer', title: 'Office clean', applicants, ...extra}, version);
const notice = () => store.docs.get('Notifications/job-application-job');
const send = (added: string[], version: number) =>
  storeApplicationNotification(store as any, 'job', added, version, 'server-timestamp');
beforeEach(() => {store = new Store();});

it('detects unique new applicants and ignores removals and unrelated job updates', () => {
  expect(addedJobApplicants({applicants: ['one']}, {applicants: ['one', 'two', 'two', null]})).toEqual(['two']);
  expect(addedJobApplicants({applicants: ['one', 'two']}, {applicants: ['one']})).toEqual([]);
  expect(addedJobApplicants({applicants: ['one']}, {applicants: ['one'], status: 'confirmed'})).toEqual([]);
  expect(addedJobApplicants(undefined, {applicants: 'one'})).toEqual([]);
});

it('creates the grouped notice for the actual customer without a client inbox read', async () => {
  job(['one'], 100);
  expect(await send(['one'], 100)).toEqual({toUserId: 'customer', title: 'New Job Application',
    body: '1 cleaner applied for "Office clean"'});
  expect(notice()).toMatchObject({type: 'application', fromUserId: 'one', toUserId: 'customer',
    jobId: 'job', applicantCount: 1, read: false, timestamp: 'server-timestamp', applicationUpdatedAt: 100});
  expect(await send(['one'], 100)).toBeNull();
});

it('reuses a legacy notice, uses actual unique applicant count and resets unread on a new application', async () => {
  store.docs.set('Notifications/legacy', {type: 'application', toUserId: 'customer', jobId: 'job',
    applicantCount: 50, read: true});
  job(['one', 'two', 'two'], 200);
  await send(['two'], 200);
  expect(store.docs.get('Notifications/legacy')).toMatchObject({applicantCount: 2, read: false,
    body: '2 cleaners applied for "Office clean"', applicationUpdatedAt: 200});
  expect(notice()).toBeUndefined();
});

it('handles simultaneous and out-of-order events without duplicating or regressing the notice', async () => {
  job(['one', 'two'], 200);
  const results = await Promise.all([send(['one'], 100), send(['two'], 200)]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(notice()).toMatchObject({applicantCount: 2, applicationUpdatedAt: 200});
  notice().read = true;
  expect(await send(['one'], 100)).toBeNull();
  expect(notice().read).toBe(true);
  job(['one', 'two', 'three'], 300);
  await send(['three'], 300);
  expect(notice()).toMatchObject({applicantCount: 3, read: false, applicationUpdatedAt: 300});
});

it('skips deleted jobs, withdrawn applicants, missing owners and changes with no additions', async () => {
  expect(await send(['one'], 100)).toBeNull();
  job([], 200);
  expect(await send(['one'], 100)).toBeNull();
  job(['one'], 300, {jobId: null});
  expect(await send(['one'], 300)).toBeNull();
  expect(await send([], 300)).toBeNull();
  expect(store.docs.size).toBe(1);
});

it('retains inbox contents for a different recipient and other notification types', async () => {
  store.docs.set('Notifications/other', {jobId: 'job', toUserId: 'another', type: 'application', read: true});
  store.docs.set('Notifications/completion', {jobId: 'job', toUserId: 'customer', type: 'completion', read: true});
  job(['one'], 100);
  await send(['one'], 100);
  expect(store.docs.get('Notifications/other').read).toBe(true);
  expect(store.docs.get('Notifications/completion').read).toBe(true);
  expect(notice().toUserId).toBe('customer');
});
