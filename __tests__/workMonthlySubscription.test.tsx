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
  collection: () => ({
    where: (_field: string, _op: string, uid: string) => ({
      onSnapshot: (_options: any, change: any, error: any) => {
        const stop = jest.fn();
        mockInvoiceSubscriptions.push({uid, change, error, stop});
        return stop;
      },
    }),
  }),
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
  jobId: null,
  source: 'clock',
  startedAt: NOW - 3600000,
  endedAt: NOW,
  autoStopAt: NOW + 3600000,
  reportingTimeZone: 'UTC',
  durationMs: 3600000,
});
const paidInvoice = () => ({
  id: 'invoice',
  cleanerId: mockUid,
  jobId: 'job',
  price: '$50',
  paymentStatus: 'paid',
  paidAt: new Date(2026, 9, 15),
});
const emit = async (
  sessions = [workRecord()],
  invoices = [paidInvoice()],
  cached = false,
) => {
  await act(async () => {
    mockSessionSubscriptions[mockSessionSubscriptions.length - 1].change(
      sessions,
    );
    mockSessionSubscriptions[mockSessionSubscriptions.length - 1].cache(cached);
    mockInvoiceSubscriptions[mockInvoiceSubscriptions.length - 1].change({
      docs: invoices.map(value => ({id: value.id, data: () => value})),
      metadata: {fromCache: cached},
    });
  });
};
beforeEach(async () => {
  mockUid = 'cleaner';
  mockFocused = true;
  mockSessionSubscriptions.length = 0;
  mockInvoiceSubscriptions.length = 0;
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

it('waits for both full datasets and reacts to paid-invoice reversals and confirmed-time edits', async () => {
  expect(current.loading).toBe(true);
  await act(async () => {
    mockSessionSubscriptions[0].change([workRecord()]);
  });
  expect(current.report).toBeNull();
  await emit();
  expect(current.report?.collected).toBe(50);
  expect(current.report?.confirmedMs).toBe(3600000);
  await emit(
    [{...workRecord(), startedAt: NOW - 1800000}],
    [{...paidInvoice(), paymentStatus: 'unpaid'}],
  );
  expect(current.report?.confirmedMs).toBe(1800000);
  expect(current.report?.collected).toBe(0);
  expect(current.report?.outstandingTotal).toBe(50);
});
it('marks cached totals and never turns a failed invoice read into zero collected', async () => {
  await emit(undefined, undefined, true);
  expect(current.fromCache).toBe(true);
  await act(async () => {
    mockInvoiceSubscriptions[0].error(new Error('offline'));
  });
  expect(current.report).toBeNull();
  expect(current.error).toContain('invoice totals');
  expect(current.loading).toBe(false);
  await act(async () => {
    current.retry();
  });
  expect(mockInvoiceSubscriptions).toHaveLength(2);
  expect(mockInvoiceSubscriptions[0].stop).toHaveBeenCalled();
  await emit();
  expect(current.error).toBe('');
});
it('clears old month totals immediately and ignores late callbacks from the previous month', async () => {
  await emit();
  const oldSessions = mockSessionSubscriptions[0];
  const oldInvoices = mockInvoiceSubscriptions[0];
  await act(async () => {
    renderer.update(<Consumer month={10} />);
  });
  expect(current.report).toBeNull();
  await act(async () => {
    oldSessions.change([workRecord()]);
    oldInvoices.change({docs: [], metadata: {fromCache: false}});
  });
  expect(current.report).toBeNull();
  expect(oldSessions.stop).toHaveBeenCalled();
  await emit();
  expect(current.report?.confirmedMs).toBe(0);
  expect(current.report?.collected).toBe(0);
});
it('isolates accounts, including callbacks that arrive after auth changed but before a new screen read', async () => {
  await emit();
  mockUid = 'other';
  await act(async () => {
    mockSessionSubscriptions[0].change([workRecord()]);
  });
  expect(current.report?.confirmedMs).toBe(3600000);
  mockWork = {...mockWork, uid: mockUid};
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(current.report).toBeNull();
  await emit(
    [{...workRecord(), cleanerId: 'cleaner'}],
    [{...paidInvoice(), cleanerId: 'cleaner'}],
  );
  expect(current.report?.confirmedMs).toBe(0);
  expect(current.report?.collected).toBe(0);
});
it('stops background listeners and preserves existing-history access after expiry or feature disablement', async () => {
  mockFocused = false;
  await act(async () => {
    renderer.update(<Consumer />);
  });
  expect(mockSessionSubscriptions[0].stop).toHaveBeenCalled();
  expect(mockInvoiceSubscriptions[0].stop).toHaveBeenCalled();
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
  expect(current.report?.collected).toBe(50);
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
