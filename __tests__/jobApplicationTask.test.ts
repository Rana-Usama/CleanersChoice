const mockStoreNotice = jest.fn();
const mockSend = jest.fn();
const mockGetCustomer = jest.fn();
const mockDb = {collection: jest.fn(() => ({doc: jest.fn(() => ({get: mockGetCustomer}))}))};
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentUpdated: (options: any, handler: any) => Object.assign(handler, {options}),
}), {virtual: true});
jest.mock('firebase-admin', () => ({
  firestore: Object.assign(() => mockDb, {FieldValue: {serverTimestamp: () => 'server-timestamp'}}),
  messaging: () => ({send: mockSend}),
}), {virtual: true});
jest.mock('../functions/src/jobs/applicationNotifications', () => ({
  ...jest.requireActual('../functions/src/jobs/applicationNotifications'),
  storeApplicationNotification: (...args: any[]) => mockStoreNotice(...args),
}));
import {notifyJobApplications} from '../functions/src/jobs/tasks';
const trigger = notifyJobApplications as any;
const event = (before = ['one'], after = ['one', 'two']) => ({params: {jobId: 'job'}, data: {
  before: {data: () => ({applicants: before})},
  after: {data: () => ({applicants: after}), updateTime: {toMillis: () => 100}},
}});
beforeEach(() => {
  jest.clearAllMocks();
  mockStoreNotice.mockResolvedValue({toUserId: 'customer', title: 'New Job Application', body: '2 cleaners applied'});
  mockGetCustomer.mockResolvedValue({data: () => ({fcmToken: 'customer-token'})});
  mockSend.mockResolvedValue('sent');
});
it('watches job updates and stores the notice before sending a customer push', async () => {
  expect(trigger.options).toMatchObject({document: 'Jobs/{jobId}', region: 'us-central1', retry: true});
  await trigger(event());
  expect(mockStoreNotice).toHaveBeenCalledWith(mockDb, 'job', ['two'], 100, 'server-timestamp');
  expect(mockDb.collection).toHaveBeenCalledWith('Users');
  expect(mockSend).toHaveBeenCalledWith({token: 'customer-token', notification: {
    title: 'New Job Application', body: '2 cleaners applied'}, data: {screen: 'notifications'}});
});
it('sends no push for a replay or unrelated job change', async () => {
  mockStoreNotice.mockResolvedValueOnce(null);
  await trigger(event());
  expect(mockSend).not.toHaveBeenCalled();
  mockStoreNotice.mockClear();
  await trigger(event(['one'], ['one']));
  await trigger(event(['one', 'two'], ['one']));
  expect(mockStoreNotice).not.toHaveBeenCalled();
});
it('keeps inbox delivery independent of a missing push token or failed push', async () => {
  mockGetCustomer.mockResolvedValueOnce({data: () => ({})});
  await trigger(event());
  expect(mockSend).not.toHaveBeenCalled();
  mockSend.mockRejectedValueOnce(new Error('token expired'));
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(trigger(event())).resolves.toBeUndefined();
  expect(mockStoreNotice).toHaveBeenCalledTimes(2);
  warning.mockRestore();
});
it('retries failed inbox writes instead of silently losing the customer notice', async () => {
  mockStoreNotice.mockRejectedValueOnce(new Error('temporary database failure'));
  await expect(trigger(event())).rejects.toThrow('temporary database failure');
  expect(mockSend).not.toHaveBeenCalled();
});
