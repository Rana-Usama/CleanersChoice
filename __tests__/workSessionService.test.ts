import {clockIn, clockOut, createWorkSessionRequestId, reconcileWorkSession} from '../src/services/workSessionService';

const mockGetIdToken = jest.fn();
let mockSignedIn = true;
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: mockSignedIn ? {uid: 'cleaner', getIdToken: mockGetIdToken} : null,
}));
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true, default: {app: () => ({options: {projectId: 'test-project'}})},
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: () => ({doc: () => ({id: 'generated-request-id'})}),
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  mockSignedIn = true;
  mockGetIdToken.mockResolvedValue('firebase-token');
  global.fetch = mockFetch;
});
afterAll(() => {global.fetch = originalFetch;});

it('sends the Firebase identity and stable request ID to the server', async () => {
  mockFetch.mockResolvedValue({ok: true, json: async () => ({result: {sessionId: 'session', status: 'active'}})});
  const input = {requestId: createWorkSessionRequestId(), reportingTimeZone: 'UTC'};
  await clockIn(input);
  expect(mockFetch).toHaveBeenCalledWith(
    'https://us-central1-test-project.cloudfunctions.net/workSessionOperation',
    expect.objectContaining({method: 'POST', headers: {
      'Content-Type': 'application/json', Authorization: 'Bearer firebase-token',
    }, body: JSON.stringify({...input, action: 'clockIn'})}),
  );
});

it('returns a late clock-out as pending, never locally confirmed', async () => {
  const result = {sessionId: 'session', status: 'needsReview', durationMs: 0};
  mockFetch.mockResolvedValue({ok: true, json: async () => ({result})});
  expect(await clockOut({requestId: 'finish01', sessionId: 'session'})).toEqual(result);
});

it('propagates server rejection and permits retrying the exact action after an unknown network outcome', async () => {
  const input = {requestId: 'start001', reportingTimeZone: 'UTC'};
  mockFetch.mockResolvedValueOnce({ok: false, json: async () => ({
    error: {code: 'failed-precondition', message: 'Existing work needs review.'},
  })});
  await expect(clockIn(input)).rejects.toMatchObject({code: 'failed-precondition', message: 'Existing work needs review.'});
  mockFetch.mockRejectedValueOnce(new Error('offline'));
  await expect(clockIn(input)).rejects.toMatchObject({code: 'unavailable'});
  mockFetch.mockResolvedValueOnce({ok: true, json: async () => ({result: {sessionId: 'session', status: 'active'}})});
  await clockIn(input);
  expect(mockFetch.mock.calls[1][1].body).toBe(mockFetch.mock.calls[2][1].body);
});

it('does not contact the server while signed out', async () => {
  mockSignedIn = false;
  await expect(clockIn({requestId: 'start001', reportingTimeZone: 'UTC'})).rejects.toMatchObject({code: 'unauthenticated'});
  expect(mockFetch).not.toHaveBeenCalled();
});

it('uses reconciliation for automatic checks rather than confirming a clock-out', async () => {
  mockFetch.mockResolvedValue({ok: true, json: async () => ({result: {sessionId: 'session', status: 'active'}})});
  await reconcileWorkSession({requestId: 'check001', sessionId: 'session'});
  expect(JSON.parse(mockFetch.mock.calls[0][1].body).action).toBe('reconcile');
});
