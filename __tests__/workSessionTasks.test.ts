import {notifyWorkSessionReview, recoverOverdueWorkSessions, reconcileJobWorkSessionChanges}
  from '../functions/src/workSessions/tasks';
import {sweepOverdueWorkSessions, reconcileJobWorkSessions} from '../functions/src/workSessions/recovery';

const mockSend = jest.fn();
let mockSession: any;
let mockToken: string | null;
jest.mock('../functions/node_modules/firebase-admin', () => ({
  firestore: Object.assign(() => ({
    collection: (name: string) => ({doc: () => ({get: async () => ({
      data: () => name === 'WorkSessions' ? mockSession : {fcmToken: mockToken},
    })})}),
  }), {FieldValue: {serverTimestamp: () => 'server-timestamp'}}),
  messaging: () => ({send: mockSend}),
}));
jest.mock('../functions/node_modules/firebase-functions/lib/v2/providers/scheduler', () => ({
  onSchedule: (_options: unknown, handler: unknown) => handler,
}));
jest.mock('../functions/node_modules/firebase-functions/lib/v2/providers/firestore', () => ({
  onDocumentCreated: (_options: unknown, handler: unknown) => handler,
  onDocumentWritten: (_options: unknown, handler: unknown) => handler,
}));
jest.mock('../functions/src/workSessions/recovery', () => ({
  sweepOverdueWorkSessions: jest.fn(), reconcileJobWorkSessions: jest.fn(),
}));

const ID = 'a'.repeat(64);
const event = (changes: any = {}, noticeChanges: any = {}) => {
  let latest: any = {};
  const ref = {
    get: async () => ({exists: true, data: () => latest}),
    update: jest.fn(async (update: any) => {latest = {...latest, ...update};}),
  };
  return {params: {notificationId: `work-session-review-${ID}`}, data: {
    ref, data: () => ({type: 'work_session_review', workSessionId: ID, toUserId: 'cleaner',
      title: 'Untrusted title', body: 'Untrusted body', ...noticeChanges}),
  }, ...changes};
};
beforeEach(() => {
  jest.clearAllMocks();
  mockToken = 'fcm-token';
  mockSession = {id: ID, cleanerId: 'cleaner', status: 'needsReview', source: 'clock', jobSnapshot: null};
  mockSend.mockResolvedValue('message');
  (sweepOverdueWorkSessions as jest.Mock).mockResolvedValue({examined: 1, recovered: 1});
  (reconcileJobWorkSessions as jest.Mock).mockResolvedValue({examined: 1, recovered: 1});
});

it('executes the hourly sweep and propagates failures so the scheduler can retry', async () => {
  // onSchedule is mocked to expose its callback rather than the HTTP wrapper.
  const handler = recoverOverdueWorkSessions as unknown as (event: unknown) => Promise<void>;
  await handler({});
  expect(sweepOverdueWorkSessions).toHaveBeenCalledTimes(1);
  (sweepOverdueWorkSessions as jest.Mock).mockRejectedValueOnce(new Error('retry'));
  await expect(handler({})).rejects.toThrow('retry');
});

it('uses Firestore commit time for updates and event time for deletion, never client updatedAt', async () => {
  const before = {status: 'confirmed'}, after = {status: 'completed', updatedAt: 'untrusted'};
  const occurredAt = Date.UTC(2026, 9, 7, 12);
  const update = {params: {jobId: 'job'}, id: 'event', time: new Date(occurredAt + 1000).toISOString(),
    data: {before: {data: () => before}, after: {exists: true, data: () => after,
      updateTime: {toMillis: () => occurredAt}}}};
  await reconcileJobWorkSessionChanges(update as any);
  expect((reconcileJobWorkSessions as jest.Mock).mock.calls[0].slice(1))
    .toEqual(['job', before, after, occurredAt, 'event']);
  await reconcileJobWorkSessionChanges({...update, data: {
    ...update.data, after: {exists: false, data: () => undefined},
  }} as any);
  expect((reconcileJobWorkSessions as jest.Mock).mock.calls[1].slice(1))
    .toEqual(['job', before, undefined, occurredAt + 1000, 'event']);
});

it('sends a review push using trusted session content and skips an already delivered notice', async () => {
  const notice = event();
  await notifyWorkSessionReview(notice as any);
  expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
    token: 'fcm-token', notification: expect.objectContaining({title: 'Work session needs review'}),
    data: {screen: 'notifications', type: 'work_session_review', workSessionId: ID},
  }));
  expect(notice.data.ref.update).toHaveBeenCalledWith({pushDeliveredAt: 'server-timestamp'});
  await notifyWorkSessionReview(notice as any);
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('skips stale review notices after the cleaner has already confirmed hours', async () => {
  mockSession.status = 'confirmed';
  const notice = event();
  await notifyWorkSessionReview(notice as any);
  expect(mockSend).not.toHaveBeenCalled();
  expect(notice.data.ref.update).toHaveBeenCalledWith(expect.objectContaining({pushSkipReason: 'already-resolved'}));
});

it('does not turn ordinary or forged client notifications into recovery pushes', async () => {
  await notifyWorkSessionReview(event({}, {type: 'completion'}) as any);
  await notifyWorkSessionReview(event({}, {toUserId: 'another-user'}) as any);
  await notifyWorkSessionReview(event({params: {notificationId: 'fake'}}) as any);
  expect(mockSend).not.toHaveBeenCalled();
});

it('keeps the in-app notice when no token is available or the token is invalid', async () => {
  mockToken = null;
  const missing = event();
  await notifyWorkSessionReview(missing as any);
  expect(missing.data.ref.update).toHaveBeenCalledWith(expect.objectContaining({pushSkipReason: 'no-token'}));
  mockToken = 'invalid';
  mockSend.mockRejectedValueOnce({code: 'messaging/registration-token-not-registered'});
  const invalid = event();
  await notifyWorkSessionReview(invalid as any);
  expect(invalid.data.ref.update).toHaveBeenCalledWith(expect.objectContaining({pushSkipReason: 'invalid-token'}));
});

it('retries transient messaging failures without recording a false successful delivery', async () => {
  const notice = event();
  mockSend.mockRejectedValueOnce(new Error('messaging unavailable'));
  await expect(notifyWorkSessionReview(notice as any)).rejects.toThrow('messaging unavailable');
  expect(notice.data.ref.update).not.toHaveBeenCalled();
  await notifyWorkSessionReview(notice as any);
  expect(notice.data.ref.update).toHaveBeenCalledWith({pushDeliveredAt: 'server-timestamp'});
});
