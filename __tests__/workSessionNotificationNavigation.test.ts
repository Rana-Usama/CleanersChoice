import {handleNotificationTap, flushPendingNotification} from '../src/utils/notificationNavigation';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

let mockUser: any;
let mockReady = true;
const mockNavigate = jest.fn();
jest.mock('@react-native-firebase/auth', () => () => ({currentUser: {uid: 'cleaner'}}));
jest.mock('@react-native-firebase/firestore', () => () => ({collection: () => ({doc: () => ({
  get: async () => ({data: () => mockUser}),
})})}));
jest.mock('../src/utils/navigationRef', () => ({navigationRef: {
  isReady: () => mockReady, navigate: (...args: any[]) => mockNavigate(...args),
}}));
const drain = async () => {for (let i = 0; i < 10; i++) await Promise.resolve();};
beforeEach(() => {
  mockNavigate.mockClear(); mockReady = true;
  mockUser = {role: 'Cleaner', subscriptionEndDate: 1000, instructionsAccepted: true,
    instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION, name: 'Cleaner', phone: '+1-321-659-6898',
    serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97}};
});

it('opens the owned review route after ordinary expiry instead of trapping a shift on the paywall', async () => {
  handleNotificationTap({screen: 'notifications', type: 'work_session_review', workSessionId: 'session'});
  await drain();
  expect(mockNavigate).toHaveBeenCalledWith('WorkTracking', {sessionId: 'session'});
});

it('keeps ordinary job pushes on the paywall for expired cleaners', async () => {
  handleNotificationTap({screen: 'notifications', type: 'confirmation'});
  await drain();
  expect(mockNavigate).toHaveBeenCalledWith('Premium');
});

it('does not use a work reminder to bypass suspension or onboarding', async () => {
  mockUser.accountStatus = 'suspended';
  handleNotificationTap({screen: 'worktracking', type: 'work_session_reminder', workSessionId: 'session'});
  await drain();
  expect(mockNavigate).toHaveBeenCalledWith('Premium');
});

it('queues a cold-start reminder until the full navigator is ready', async () => {
  mockReady = false;
  handleNotificationTap({screen: 'worktracking', type: 'work_session_reminder', workSessionId: 'session'});
  expect(mockNavigate).not.toHaveBeenCalled();
  mockReady = true;
  flushPendingNotification();
  await drain();
  expect(mockNavigate).toHaveBeenCalledWith('WorkTracking', {sessionId: 'session'});
});
