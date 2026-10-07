import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import ManualWorkEntry from '../src/screens/cleanerflow/work/ManualWorkEntry';
import WorkSessionDetails from '../src/screens/cleanerflow/work/WorkSessionDetails';
import {WorkTimeFields} from '../src/components/work/WorkTimeFields';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';
const NOW = Date.UTC(2026, 9, 7, 9);
let mockWork: any;
let mockUid = 'cleaner';
let mockRecordListener: any;
let mockRecordError: any;
const mockJobs = jest.fn();
const mockHistory = jest.fn();
const mockOriginal = jest.fn();
jest.mock('../src/components/work/WorkSessionProvider', () => ({
  useWorkSessions: () => mockWork,
}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {uid: mockUid},
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async () => null,
  setItem: async () => {},
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));
jest.mock('react-native-date-picker', () => 'DatePicker');
jest.mock('react-native-responsive-fontsize', () => ({
  RFPercentage: (value: number) => value,
}));
jest.mock('../src/services/workSessionService', () => ({
  getManualWorkJobs: (...args: any[]) => mockJobs(...args),
  subscribeWorkSession: (_id: string, changed: any, failed: any) => {
    mockRecordListener = changed;
    mockRecordError = failed;
    return jest.fn();
  },
  getWorkSessionHistoryPage: (...args: any[]) => mockHistory(...args),
  getOriginalWorkSessionEvent: (...args: any[]) => mockOriginal(...args),
}));
const navigation: any = {
  goBack: jest.fn(),
  canGoBack: () => true,
  navigate: jest.fn(),
  replace: jest.fn(),
};
let renderer: Renderer.ReactTestRenderer;
const buttons = () => renderer.root.findAllByType(TouchableOpacity);
const press = async (label: string) => {
  const button = buttons().find(item =>
    item.findAllByType(Text).some(text => text.props.children === label),
  );
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
};
const screenText = () =>
  renderer.root
    .findAllByType(Text)
    .map(item => JSON.stringify(item.props.children))
    .join(' ');
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
  jest.clearAllMocks();
  mockUid = 'cleaner';
  mockWork = {
    uid: mockUid,
    now: NOW,
    config: {
      enabled: true,
      graceHours: 3,
      hardCapHours: 12,
      manualEntryMaxAgeDays: 7,
    },
    manualAvailable: true,
    pending: false,
    busy: false,
    pendingRequest: null,
    error: '',
    user: {
      role: 'Cleaner',
      subscriptionEndDate: NOW + 24 * 3600000,
      instructionsAccepted: true,
      instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
      name: 'Cleaner',
      phone: '+1-321-659-6898',
      serviceLocation: {
        city: 'Austin',
        state: 'TX',
        latitude: 30,
        longitude: -97,
      },
    },
    saveManual: jest
      .fn()
      .mockResolvedValue({sessionId: 'record', status: 'needsReview'}),
    review: jest.fn().mockResolvedValue(false),
    edit: jest.fn().mockResolvedValue(false),
    retry: jest
      .fn()
      .mockResolvedValue({sessionId: 'record', status: 'needsReview'}),
  };
  mockJobs.mockResolvedValue({jobs: [], cursor: null, hasMore: false});
  mockHistory.mockResolvedValue({events: [], cursor: null, hasMore: false});
  mockOriginal.mockResolvedValue(null);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.useRealTimers();
});
const manual = async () => {
  await act(async () => {
    renderer = Renderer.create(
      <ManualWorkEntry
        navigation={navigation}
        route={{key: 'manual', name: 'ManualWorkEntry'}}
      />,
    );
  });
};
const record = (status = 'needsReview'): any => ({
  id: 'record',
  cleanerId: 'cleaner',
  status,
  source: 'manualCleaner',
  jobId: null,
  startedAt: NOW - 2 * 3600000,
  endedAt: NOW - 3600000,
  durationMs: status === 'confirmed' ? 3600000 : 0,
  estimatedDurationMs: status === 'needsReview' ? 3600000 : 0,
  reportingTimeZone: 'UTC',
  updatedAt: NOW,
  revision: 1,
  note: 'Night cleaning',
  stopReason: null,
  paySnapshot: {
    basis: 'general',
    hourlyRate: 25,
    rateSource: 'cleanerDefault',
    capturedAt: NOW,
  },
});
const details = async (session = record()) => {
  await act(async () => {
    renderer = Renderer.create(
      <WorkSessionDetails
        navigation={navigation}
        route={{
          key: 'record',
          name: 'WorkSessionDetails',
          params: {sessionId: 'record'},
        }}
      />,
    );
  });
  await act(async () => {
    mockRecordListener(session);
  });
};

it('saves manual work as pending and opens a separate confirmation screen', async () => {
  await manual();
  await press('Save pending record');
  expect(mockWork.saveManual).toHaveBeenCalledWith(
    expect.objectContaining({
      jobId: null,
      note: '',
      reportingTimeZone: expect.any(String),
    }),
  );
  expect(navigation.replace).toHaveBeenCalledWith('WorkSessionDetails', {
    sessionId: 'record',
  });
  expect(mockWork.review).not.toHaveBeenCalled();
});
it('freezes the original uncertain manual request after restart and retries without creating a new one', async () => {
  mockWork.pending = true;
  mockWork.pendingRequest = {
    action: 'addManual',
    requestId: 'original',
    startedAt: NOW - 5 * 3600000,
    endedAt: NOW - 3 * 3600000,
    note: 'Saved note',
    reportingTimeZone: 'America/New_York',
    jobId: 'assigned',
  };
  await manual();
  const fields = renderer.root.findByType(WorkTimeFields);
  expect(fields.props.disabled).toBe(true);
  expect(fields.props.value).toEqual({
    startedAt: mockWork.pendingRequest.startedAt,
    endedAt: mockWork.pendingRequest.endedAt,
    note: 'Saved note',
  });
  await press('Retry saved action');
  expect(mockWork.retry).toHaveBeenCalledTimes(1);
  expect(mockWork.saveManual).not.toHaveBeenCalled();
  expect(navigation.replace).toHaveBeenCalledWith('WorkSessionDetails', {
    sessionId: 'record',
  });
});
it('shows an overlap rejection on the form and keeps General work usable when assigned jobs fail to load', async () => {
  mockJobs.mockRejectedValueOnce(new Error('offline'));
  mockWork.saveManual.mockRejectedValueOnce(
    new Error('This interval overlaps another work record.'),
  );
  await manual();
  const choose = buttons().find(item =>
    item
      .findAllByType(Text)
      .some(text => JSON.stringify(text.props.children).includes('Choose')),
  )!;
  await act(async () => {
    choose.props.onPress();
  });
  expect(screenText()).toContain('Could not load assigned jobs');
  await press('General work');
  await press('Save pending record');
  expect(screenText()).toContain('overlaps');
  expect(navigation.replace).not.toHaveBeenCalled();
});
it('blocks invalid manual intervals before saving', async () => {
  await manual();
  await act(async () => {
    renderer.root.findByType(WorkTimeFields).props.onChange({
      startedAt: NOW - 3600000,
      endedAt: NOW + 3600000,
      note: '',
    });
  });
  expect(screenText()).toContain('future');
  const save = buttons().find(item =>
    item
      .findAllByType(Text)
      .some(text => text.props.children === 'Save pending record'),
  )!;
  expect(save.props.disabled).toBe(true);
  await act(async () => {
    await save.props.onPress();
  });
  expect(mockWork.saveManual).not.toHaveBeenCalled();
});
it('keeps pending estimates separate, then exposes correction and preserves original history', async () => {
  const initial = record();
  mockOriginal.mockResolvedValue({
    after: {...initial},
    at: NOW,
    action: 'addManual',
  });
  mockHistory.mockResolvedValue({
    events: [
      {
        id: 'audit',
        action: 'edit',
        actorId: 'cleaner',
        at: NOW,
        note: 'Corrected start',
        before: {...initial},
        after: {...initial, status: 'confirmed'},
      },
    ],
    cursor: {id: 'cursor'},
    hasMore: true,
  });
  await details(initial);
  expect(screenText()).toContain('estimated');
  expect(screenText()).toContain('not counted');
  await press('Review actual times');
  expect(mockWork.review).toHaveBeenCalledWith(initial);
  await act(async () => {
    mockRecordListener({...record('confirmed'), revision: 2});
  });
  expect(screenText()).toContain('1h 0m');
  expect(screenText()).toContain('Originally recorded');
  expect(screenText()).toContain('Corrected start');
  await press('Correct this record');
  expect(mockWork.edit).toHaveBeenCalledWith(
    expect.objectContaining({revision: 2}),
  );
  await press('Load older changes');
  expect(mockHistory).toHaveBeenLastCalledWith('record', {id: 'cursor'});
});
it('removes private detail and history content when access is denied', async () => {
  await details();
  expect(screenText()).toContain('Night cleaning');
  await act(async () => {
    mockRecordError(new Error('permission-denied'));
  });
  expect(screenText()).not.toContain('Night cleaning');
  expect(screenText()).toContain('Could not load this work record');
});
