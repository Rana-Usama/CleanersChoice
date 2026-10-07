import {
  canStartWork,
  canUseWorkRecords,
  formatWorkDuration,
  workSessionPhase,
} from '../src/utils/workSessionFlow';
import {resolveCleanerRoute} from '../src/utils/cleanerRoute';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';
import type {WorkSession} from '../src/types/workSession';
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('@react-native-firebase/auth', () => () => ({}));
const user = {
  role: 'Cleaner',
  instructionsAccepted: true,
  instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
  name: 'Cleaner',
  phone: '+1-321-659-6898',
  subscriptionEndDate: 2000,
  serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97},
};

it('lets ordinary expiry keep record access while blocking new starts', () => {
  expect(canUseWorkRecords(user)).toBe(true);
  expect(canStartWork(user, 1000)).toBe(true);
  expect(canStartWork(user, 2000)).toBe(false);
  expect(resolveCleanerRoute(user, true)).toBe('WorkTracking');
  expect(resolveCleanerRoute(user)).toBe('Premium');
});

it.each([
  {role: 'Customer'},
  {accountStatus: 'suspended'},
  {subscriptionStatus: 'refunded'},
  {instructionsAccepted: false},
  {serviceLocation: null},
])(
  'cannot use record access to bypass account/onboarding restrictions: %p',
  changes => {
    const restricted = {...user, ...changes};
    expect(canUseWorkRecords(restricted)).toBe(false);
    expect(canStartWork(restricted, 1000)).toBe(false);
    expect(resolveCleanerRoute(restricted, true)).not.toBe('WorkTracking');
  },
);

it('uses expected end then the saved deadline and never revives pending/confirmed work', () => {
  const current = {
    status: 'active',
    expectedEndAt: 2000,
    autoStopAt: 4000,
  } as WorkSession;
  expect(workSessionPhase(current, 1999)).toBe('working');
  expect(workSessionPhase(current, 2000)).toBe('checkIn');
  expect(workSessionPhase(current, 4000)).toBe('overdue');
  expect(workSessionPhase({...current, status: 'needsReview'}, 3000)).toBe(
    'needsReview',
  );
  expect(workSessionPhase({...current, status: 'confirmed'}, 5000)).toBe(
    'confirmed',
  );
  expect(workSessionPhase({...current, expectedEndAt: null}, 3000)).toBe(
    'working',
  );
});

it('formats elapsed hours without adding pending estimates or invented money', () => {
  expect(formatWorkDuration(2.5 * 3600000)).toBe('2h 30m');
  expect(formatWorkDuration(-1000)).toBe('0h 0m');
});
