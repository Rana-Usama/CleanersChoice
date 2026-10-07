import {syncWorkReminder} from '../src/services/workSessionReminders';
import type {WorkSession} from '../src/types/workSession';

const mockSaved = new Map();
const mockCreate = jest.fn();
const mockCancel = jest.fn();
let mockAuthorized = 1;
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (key: string) => mockSaved.get(key) || null,
  setItem: async (key: string, value: string) => {
    mockSaved.set(key, value);
  },
  removeItem: async (key: string) => {
    mockSaved.delete(key);
  },
}));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  AndroidImportance: {HIGH: 4},
  AuthorizationStatus: {DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2},
  TriggerType: {TIMESTAMP: 0},
  default: {
    getNotificationSettings: async () => ({
      authorizationStatus: mockAuthorized,
    }),
    createChannel: async () => 'work-hours',
    createTriggerNotification: (...args: any[]) => mockCreate(...args),
    cancelNotification: (...args: any[]) => mockCancel(...args),
  },
}));
const BASE = Date.UTC(2026, 9, 7, 9);
const session = (changes = {}) =>
  ({
    id: 'session',
    status: 'active',
    startedAt: BASE + 240000,
    expectedEndAt: BASE + 6 * 3600000,
    autoStopAt: BASE + 9 * 3600000,
    ...changes,
  } as WorkSession);
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(BASE);
  jest.clearAllMocks();
  mockSaved.clear();
  mockAuthorized = 1;
  mockCreate.mockResolvedValue('notification');
  mockCancel.mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());

it('schedules at the saved job expected end, independent of the actual clock-in time', async () => {
  await syncWorkReminder('cleaner', session());
  expect(mockCreate.mock.calls[0][1]).toEqual({
    type: 0,
    timestamp: BASE + 6 * 3600000,
  });
  expect(mockCreate.mock.calls[0][0].data).toMatchObject({
    screen: 'worktracking',
    workSessionId: 'session',
  });
});

it('cancels both a delivered/pending reminder after finish or sign-out', async () => {
  await syncWorkReminder('cleaner', session());
  await syncWorkReminder(null, null);
  expect(mockCancel).toHaveBeenCalledWith('work-reminder-cleaner-session');
  expect(mockSaved.size).toBe(0);
});

it.each([
  {expectedEndAt: null},
  {expectedEndAt: BASE},
  {expectedEndAt: BASE + 13 * 3600000},
  {status: 'needsReview'},
])(
  'does not invent/past-schedule reminders or remind after the cap: %p',
  async changes => {
    await syncWorkReminder('cleaner', session(changes));
    expect(mockCreate).not.toHaveBeenCalled();
  },
);

it('reports permission denial without changing session state', async () => {
  mockAuthorized = 0;
  const current = session();
  expect(await syncWorkReminder('cleaner', current)).toBe(false);
  expect(mockCreate).not.toHaveBeenCalled();
  expect(current.status).toBe('active');
});

it('serializes a finish with an in-flight schedule so the reminder cannot be resurrected', async () => {
  let done!: () => void;
  mockCreate.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        done = () => resolve('notification');
      }),
  );
  const scheduled = syncWorkReminder('cleaner', session());
  for (let i = 0; i < 8; i++) await Promise.resolve();
  const cancelled = syncWorkReminder('cleaner', null);
  done();
  await Promise.all([scheduled, cancelled]);
  expect(mockCancel).toHaveBeenCalledWith('work-reminder-cleaner-session');
  expect(mockSaved.size).toBe(0);
});
