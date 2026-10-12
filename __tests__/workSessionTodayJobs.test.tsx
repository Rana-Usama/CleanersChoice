import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {WorkTodayJobs} from '../src/components/work/WorkTodayJobs';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

let mockUid = 'cleaner';
let mockWork: any;
const mockListeners: {
  changed: (value: any) => void;
  failed: () => void;
  unsubscribe: jest.Mock;
}[] = [];
const mockNavigate = jest.fn();
jest.mock('../src/components/work/WorkSessionProvider', () => ({
  useWorkSessions: () => mockWork,
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
  useFocusEffect: (callback: any) => {
    require('react').useEffect(callback, [callback]);
  },
}));
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {uid: mockUid},
}));
jest.mock('@react-native-firebase/firestore', () => () => {
  const query: any = {
    where: () => query,
    onSnapshot: (changed: any, failed: any) => {
      const unsubscribe = jest.fn();
      mockListeners.push({changed, failed, unsubscribe});
      return unsubscribe;
    },
  };
  return {collection: () => query};
});
const NOW = Date.UTC(2026, 9, 10, 12);
let renderer: Renderer.ReactTestRenderer;
const text = () =>
  renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
const snapshot = (title = 'Today’s assigned job') => ({
  docs: [
    {
      id: 'job',
      data: () => ({
        title,
        confirmedCleaner: mockUid,
        status: 'confirmed',
        expectedHours: 2.5,
        scheduledStartAt: {toDate: () => new Date(NOW)},
        scheduleTimeZone: 'UTC',
      }),
    },
  ],
});
beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(NOW);
  mockUid = 'cleaner';
  mockListeners.length = 0;
  mockWork = {
    uid: mockUid,
    enabled: true,
    ready: true,
    now: NOW,
    current: null,
    reviews: [],
    user: {
      role: 'Cleaner',
      name: 'Cleaner',
      phone: '+1-321-659-6898',
      serviceLocation: {
        city: 'Austin',
        state: 'TX',
        latitude: 30,
        longitude: -97,
      },
      instructionsAccepted: true,
      instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
      subscriptionEndDate: NOW + 86400000,
    },
    start: jest.fn(),
    stop: jest.fn(),
    review: jest.fn(),
    error: '',
    busy: false,
    pending: false,
  };
  await act(async () => {
    renderer = Renderer.create(<WorkTodayJobs />);
  });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  jest.useRealTimers();
});
it('loads assigned clock-in cards and navigates to the full jobs list', async () => {
  await act(async () => mockListeners[0].changed(snapshot()));
  expect(text()).toContain('Today’s assigned job');
  expect(text()).not.toContain('expected');
  expect(text()).not.toContain('Budget');
  expect(text()).not.toContain('Work on this job');
  const viewAll = renderer.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(node => node.props.children === 'View all'),
    )!;
  await act(async () => viewAll.props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('MyJobs');
});
it('shows a retry on a failed read without reporting no jobs', async () => {
  await act(async () => mockListeners[0].failed());
  expect(text()).toContain('Could not load today’s jobs');
  expect(text()).not.toContain('No confirmed jobs');
  const retry = renderer.root
    .findAllByType(TouchableOpacity)
    .find(button => button.props.accessibilityLabel === 'Retry today’s jobs')!;
  await act(async () => retry.props.onPress());
  expect(mockListeners[0].unsubscribe).toHaveBeenCalled();
  expect(mockListeners).toHaveLength(2);
});
it('clears jobs on an account switch and ignores a late callback from the old account', async () => {
  await act(async () => mockListeners[0].changed(snapshot('Private job')));
  mockUid = 'other';
  mockWork = {...mockWork, uid: mockUid};
  await act(async () => renderer.update(<WorkTodayJobs />));
  expect(mockListeners[0].unsubscribe).toHaveBeenCalled();
  await act(async () => mockListeners[0].changed(snapshot('Old private job')));
  expect(text()).not.toContain('Private job');
  expect(text()).not.toContain('Old private job');
});

it('keeps running jobs compact and clocks out through the existing action', async () => {
  mockWork.current = {
    id: 'session',
    jobId: 'job',
    workName: 'Today’s assigned job',
    status: 'active',
    startedAt: NOW - 1800000,
    autoStopAt: NOW + 3600000,
    expectedEndAt: NOW + 1800000,
    reportingTimeZone: 'UTC',
    paySnapshot: {basis: 'hourly', hourlyRate: 25},
  };
  await act(async () => mockListeners[0].changed(snapshot()));
  expect(text()).toContain('00:30:00');
  expect(text()).not.toContain('Expected finish');
  expect(text()).not.toContain('/hr');
  expect(text()).not.toContain('Time counts once');
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(item => item.props.accessibilityLabel === 'Clock Out')!;
  await act(async () => button.props.onPress());
  expect(mockWork.stop).toHaveBeenCalledTimes(1);
});

it('opens full job details from the simple header and starts the selected job', async () => {
  await act(async () => mockListeners[0].changed(snapshot()));
  const buttons = renderer.root.findAllByType(TouchableOpacity);
  await act(async () =>
    buttons
      .find(
        item =>
          item.props.accessibilityLabel ===
          'View details for Today’s assigned job',
      )!
      .props.onPress(),
  );
  expect(mockNavigate).toHaveBeenCalledWith('JobDetails', {
    item: expect.objectContaining({id: 'job'}),
  });
  await act(async () =>
    buttons
      .find(item => item.props.accessibilityLabel === 'Clock In')!
      .props.onPress(),
  );
  expect(mockWork.start).toHaveBeenCalledWith('job');
});
