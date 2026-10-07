import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import WorkHours from '../src/screens/cleanerflow/work/WorkHours';
import {WorkMonthlyDashboard} from '../src/components/work/WorkMonthlyDashboard';
import {buildWorkMonthlyReport} from '../src/services/workMonthlyReport';
let mockMonthly: any;
let mockWork: any;
const mockNavigate = jest.fn();
const mockUseMonthly = jest.fn();
jest.mock('../src/components/work/WorkSessionProvider', () => ({
  useWorkSessions: () => mockWork,
}));
jest.mock('../src/hooks/useWorkMonthlyReport', () => ({
  useWorkMonthlyReport: (month: any) => {
    mockUseMonthly(month);
    return mockMonthly;
  },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));
jest.mock('react-native-date-picker', () => 'DatePicker');
jest.mock('../src/services/invoiceService', () => ({
  invoiceToFormData: (invoice: any) => invoice,
}));
const NOW = Date.UTC(2026, 9, 20, 12);
const saved: any = {
  id: 'record',
  cleanerId: 'cleaner',
  jobId: 'job',
  jobSnapshot: {title: 'House'},
  status: 'confirmed',
  source: 'clock',
  startedAt: NOW - 3600000,
  endedAt: NOW,
  autoStopAt: NOW + 3600000,
  reportingTimeZone: 'UTC',
};
const paid: any = {
  id: 'invoice',
  invoiceId: 'INV-1',
  cleanerId: 'cleaner',
  jobId: 'job',
  price: '$50',
  jobPostName: 'House',
  paymentStatus: 'paid',
  paidAt: new Date(2026, 9, 10),
};
const navigation: any = {goBack: jest.fn(), navigate: mockNavigate};
let renderer: Renderer.ReactTestRenderer;
const open = async () => {
  await act(async () => {
    renderer = Renderer.create(
      <WorkHours
        navigation={navigation}
        route={{
          key: 'hours',
          name: 'WorkHours',
          params: {year: 2026, month: 9},
        }}
      />,
    );
  });
};
const texts = () =>
  renderer.root
    .findAllByType(Text)
    .map(node => JSON.stringify(node.props.children))
    .join(' ');
const press = async (label: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(Text)
        .some(
          text =>
            (Array.isArray(text.props.children)
              ? text.props.children.join('')
              : text.props.children) === label,
        ),
    );
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
};
beforeEach(() => {
  jest.clearAllMocks();
  mockWork = {now: NOW, uid: 'cleaner'};
  mockMonthly = {
    available: true,
    loading: false,
    error: '',
    fromCache: false,
    retry: jest.fn(),
    report: buildWorkMonthlyReport(
      [saved],
      [paid],
      {year: 2026, month: 9},
      NOW,
    ),
  };
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});
it('shows consistent dashboard and full-screen confirmed/cash/effective totals', async () => {
  await open();
  expect(texts()).toContain('1h 0m');
  expect(texts()).toContain('$50.00');
  expect(texts()).toContain('Confirmed hours');
  const fullText = texts();
  await act(async () => {
    renderer.update(<WorkMonthlyDashboard />);
  });
  expect(texts()).toContain('1h 0m');
  expect(texts()).toContain('$50.00');
  expect(texts()).toContain('Confirmed hours');
  expect(fullText).toContain('Effective rate');
  expect(texts()).toContain('Effective rate');
});
it('changes months and drills into records and read-only paid invoices', async () => {
  await open();
  await press('Next');
  expect(mockUseMonthly).toHaveBeenLastCalledWith({year: 2026, month: 10});
  await press('Previous');
  expect(mockUseMonthly).toHaveBeenLastCalledWith({year: 2026, month: 9});
  await press('View times and history');
  expect(mockNavigate).toHaveBeenCalledWith('WorkSessionDetails', {
    sessionId: 'record',
  });
  await press('View paid invoices for this month (1)');
  await press('View paid invoice');
  expect(mockNavigate).toHaveBeenCalledWith(
    'InvoicePreview',
    expect.objectContaining({
      invoice: paid,
      viewOnly: true,
      paymentActionsDisabled: true,
    }),
  );
});
it('renders unavailable rates, pending exclusions and recovery cutoff without a running preview', async () => {
  mockMonthly.report = buildWorkMonthlyReport(
    [{...saved, status: 'active', endedAt: null, autoStopAt: NOW}],
    [paid],
    {year: 2026, month: 9},
    NOW,
  );
  await open();
  expect(texts()).toContain('Unavailable until hours are confirmed');
  expect(texts()).toContain('not counted');
  expect(texts()).toContain('reached its stop deadline');
  expect(texts()).not.toContain('Including current session');
});
it('shows loading, errors and cache labels without claiming a failed read is a zero total', async () => {
  mockMonthly.report = null;
  mockMonthly.error = 'Could not load the invoice totals.';
  await open();
  expect(texts()).toContain('Could not load');
  expect(texts()).not.toContain('Collected:');
  await press('Retry monthly totals');
  expect(mockMonthly.retry).toHaveBeenCalled();
  mockMonthly = {...mockMonthly, error: '', loading: true};
  await act(async () => {
    renderer.update(
      <WorkHours
        navigation={navigation}
        route={{key: 'hours', name: 'WorkHours'}}
      />,
    );
  });
  expect(texts()).toContain('Loading monthly hours');
  mockMonthly = {
    ...mockMonthly,
    loading: false,
    fromCache: true,
    report: buildWorkMonthlyReport([], [], {year: 2026, month: 9}, NOW),
  };
  await act(async () => {
    renderer.update(
      <WorkHours
        navigation={navigation}
        route={{key: 'hours', name: 'WorkHours'}}
      />,
    );
  });
  expect(texts()).toContain('Cached totals may be incomplete');
});
