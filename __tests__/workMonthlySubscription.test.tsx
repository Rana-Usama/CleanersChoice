import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {useWorkMonthlyReport} from '../src/hooks/useWorkMonthlyReport';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';
const NOW = Date.UTC(2026, 9, 20, 12);
let mockWork: any;
let mockUid = 'cleaner';
let mockFocused = true;
const mockSessionSubscriptions: any[] = [];
const mockInvoiceSubscriptions: any[] = [];
const mockEarningSubscriptions: any[] = [];
jest.mock('../src/components/work/WorkSessionProvider', () => ({
  useWorkSessions: () => mockWork,
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockFocused,
}));
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {uid: mockUid},
}));
jest.mock('../src/services/workSessionService', () => ({
  subscribeWorkSessions: (range: any, change: any, error: any, cache: any) => {
    const stop = jest.fn();
    mockSessionSubscriptions.push({range, change, error, cache, stop});
    return stop;
  },
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: (name: string) => {
    // where() is chainable because JobEarnings filters on cleanerId and a
    // completedAt range; the terminal onSnapshot routes by collection.
    const query: any = {
      uid: '',
      where(_field: string, _op: string, value: any) {
        if (_field === 'cleanerId') {
          query.uid = value;
        }
        return query;
      },
      onSnapshot(_options: any, change: any, error: any) {
        const stop = jest.fn();
        const target =
          name === 'JobEarnings'
            ? mockEarningSubscriptions
            : mockInvoiceSubscriptions;
        target.push({uid: query.uid, change, error, stop});
        return stop;
      },
    };
    return query;
  },
}));
let current: ReturnType<typeof useWorkMonthlyReport>;
let renderer: Renderer.ReactTestRenderer;
const Consumer = ({month = 9}: {month?: number}) => {
  current = useWorkMonthlyReport({year: 2026, month});
  return null;
};
const workRecord = (status = 'confirmed') => ({
  id: 'work',
  cleanerId: mockUid,
  status,
  jobId: 'job-hourly',
  paySnapshot: {basis: 'hourly', hourlyRate: 25, rateSource: 'job'},
  source: 'clock',
  startedAt: NOW - 3600000,
  endedAt: NOW,
  autoStopAt: NOW + 3600000,
  reportingTimeZone: 'UTC',
  durationMs: 3600000,
});
const fixedEarning = () => ({
  jobId: 'job-flat',
  cleanerId: mockUid,
  basis: 'flat',
  amount: 80,
  completedAt: NOW,
  source: 'jobCompletion',
  revision: 1,
  updatedAt: NOW,
});
const emit = async (
  sessions = [workRecord()],
  earnings: any[] = [],
  cached = false,
) => {
  await act(async () => {
    const records =
      mockSessionSubscriptions[mockSessionSubscriptions.length - 1];
    records.change(sessions);
    records.cache(cached);
    mockEarningSubscriptions[mockEarningSubscriptions.length - 1].change({
      docs: earnings.map(value => ({id: value.jobId, data: () => value})),
      metadata: {fromCache: cached},
    });
  });
};
beforeEach(async () => {
  mockUid = 'cleaner';
  mockFocused = true;
  mockSessionSubscriptions.length = 0;
  mockInvoiceSubscriptions.length = 0;
  mockEarningSubscriptions.length = 0;
  mockWork = {
    uid: mockUid,
    enabled: true,
    hasHistory: false,
    now: NOW,
    current: null,
    user: {
      role: 'Cleaner',
      subscriptionEndDate: NOW + 3600000,
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
  };
  await act(async () => {
    renderer = Renderer.create(<Consumer />);
  });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});

it('loads hours and earned without an invoice subscription, and reacts to confirmed-time edits', async () => {
  expect(current.loading).toBe(true);
  await act(async () => {
    mockSessionSubscriptions[0].change([workRecord()]);
  });
  expect(current.report).toBeNull();
  await emit(undefined, [fixedEarning()]);
  expect(mockInvoiceSubscriptions).toHaveLength(0);
  expect(current.report?.earned).toBe(105);
  expect(current.report?.confirmedMs).toBe(3600000);
  await emit([{...workRecord(), startedAt: NOW - 1800000}], [fixedEarning()]);
  expect(current.report?.confirmedMs).toBe(1800000);
  expect(current.report?.earned).toBe(92.5);
});
it('marks cached totals, blocks incomplete hours and restores listeners on retry', async () => {
  await emit(undefined, undefined, true);
  expect(current.fromCache).toBe(true);
  await act(async () => {
    mockSessionSubscriptions[0].error(new Error('offline'));
  });
  expect(current.report).toBeNull();
  expect(current.error).toContain('all work');
  expect(current.loading).toBe(false);
  await act(async () => {
    current.retry();
  });
  expect(mockSessionSubscriptions).toHaveLength(2);
  expect(mockSessionSubscriptions[0].stop).toHaveBeenCalled();
  expect(mockEarningSubscriptions[0].stop).toHaveBeenCalled();
  await emit();
  expect(current.error).toBe('');
});
it('clears old month totals immediately and ignores late callbacks from the previous month', async () => {
  await emit();
  const oldSessions = mockSessionSubscriptions[0];
  const oldEarnings = mockEarningSubscriptions[0];
  await act(async () => {
    renderer.update(<Consumer month={10} />);
  });
  expect(current.report).toBeNull();
  await act(async () => {
    oldSessions.change([workRecord()]);
    oldEarnings.change({
      docs: [{data: fixedEarning}],
      metadata: {fromCache: false},
    });
  });
  expect(current.report).toBeNull();
  expect(oldSessions.stop).toHaveBeenCalled();
  expect(oldEarnings.stop).toHaveBeenCalled();
  await emit(undefined, [fixedEarning()]);
  expect(current.report?.confirmedMs).toBe(0);
  expect(current.report?.earned).toBe(0);
});
it('isolates accounts, including callbacks after auth changes and before a new screen read', async () => {
  await emit(undefined, [fixedEarning()]);
  const oldEarnings = mockEarningSubscriptions[0];
  mockUid = 'other';
  await act(async () => {
    mockSessionSubscriptions[0].change([workRecord()]);
    oldEarnings.change({docs: [], metadata: {fromCache: false}});
  });
  expect(current.report?.earned).toBe(105);
  mockWork = {...mockWork, uid: mockUid};
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(current.report).toBeNull();
  await emit(
    [{...workRecord(), cleanerId: 'cleaner'}],
    [{...fixedEarning(), cleanerId: 'cleaner'}],
  );
  expect(current.report?.confirmedMs).toBe(0);
  expect(current.report?.earned).toBe(0);
});
it('stops background listeners and preserves history access after expiry or feature disablement', async () => {
  mockFocused = false;
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(mockSessionSubscriptions[0].stop).toHaveBeenCalled();
  expect(mockEarningSubscriptions[0].stop).toHaveBeenCalled();
  mockWork = {
    ...mockWork,
    enabled: false,
    hasHistory: true,
    user: {...mockWork.user, subscriptionEndDate: NOW - 3600000},
  };
  mockFocused = true;
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(current.available).toBe(true);
  await emit();
  expect(current.report?.earned).toBe(25);
  mockWork = {
    ...mockWork,
    user: {...mockWork.user, subscriptionStatus: 'refunded'},
  };
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(current.available).toBe(false);
  expect(current.report).toBeNull();
});
it('includes the earnings-ledger cache flag and clears it when fresh data arrives', async () => {
  await emit();
  await act(async () => {
    mockEarningSubscriptions[0].change({docs: [], metadata: {fromCache: true}});
  });
  expect(current.fromCache).toBe(true);
  await emit();
  expect(current.fromCache).toBe(false);
});
it('keeps hours available with a visible warning when fixed-price earnings cannot load', async () => {
  await act(async () => {
    mockSessionSubscriptions[0].change([workRecord()]);
    mockEarningSubscriptions[0].error(new Error('offline'));
  });
  expect(current.report?.confirmedMs).toBe(3600000);
  expect(current.error).toContain('fixed-price job earnings');
  expect(current.loading).toBe(false);
});
