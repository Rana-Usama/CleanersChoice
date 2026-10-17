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
  useSafeAreaInsets: () => ({top: 24, bottom: 16, left: 0, right: 0}),
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
  paySnapshot: {basis: 'hourly', hourlyRate: 25, rateSource: 'job'},
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
// Text nodes now nest (a "/hr" unit inside the value, bold leads inside the
// explanations), and React elements hold circular fiber refs, so JSON.stringify
// throws on them. Flatten to the strings only.
const flatten = (value: any): string => {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(flatten).join('');
  }
  if (typeof value === 'object') {
    return flatten(value.props?.children);
  }
  return String(value);
};
const texts = () =>
  renderer.root
    .findAllByType(Text)
    .map(node => flatten(node.props.children))
    .join(' ');
// The month stepper is icon-only, so it is pressed by accessibility label.
const pressLabel = async (label: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
};
// Session rows are date-led ("Tue, Oct 20 · House"), so they are matched on a
// substring rather than the whole formatted title, which would pin the test to
// a date format.
const pressContaining = async (needle: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => flatten(text.props.children).includes(needle)),
    );
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
};
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
it('shows hours and earned on the monthly screen and links to them from the compact dashboard', async () => {
  await open();
  // The calendar footer carries the month: confirmed hours · earned.
  expect(texts()).toContain('1h 0m · $25.00');
  expect(texts()).toContain('All sessions');
  const fullText = texts();
  await act(async () => {
    renderer.update(<WorkMonthlyDashboard />);
  });
  // The dashboard's current design uses a navigation row; totals live on Work Hours.
  expect(texts()).toContain('Work Hours ›');
  for (const removed of [
    'Collected',
    'Unpaid',
    'unbilled',
    'Effective rate',
    'Provisional rate',
    '$50.00',
  ]) {
    expect(fullText).not.toContain(removed);
    expect(texts()).not.toContain(removed);
  }
  expect(fullText).toContain('$25.00');
});
it('changes months and drills into work records without payment breakdowns', async () => {
  await open();
  await pressLabel('Next');
  expect(mockUseMonthly).toHaveBeenLastCalledWith({year: 2026, month: 10});
  await pressLabel('Previous');
  expect(mockUseMonthly).toHaveBeenLastCalledWith({year: 2026, month: 9});
  // The whole session row navigates.
  await pressContaining('House');
  expect(mockNavigate).toHaveBeenCalledWith('WorkSessionDetails', {
    sessionId: 'record',
  });
  expect(texts()).not.toContain('earnings breakdown');
  expect(texts()).not.toContain('Paid this month');
  expect(texts()).not.toContain('INV-1');
});
it('renders pending exclusions and recovery cutoff without a running preview', async () => {
  mockMonthly.report = buildWorkMonthlyReport(
    [{...saved, status: 'active', endedAt: null, autoStopAt: NOW}],
    [paid],
    {year: 2026, month: 9},
    NOW,
  );
  await open();
  expect(texts()).not.toContain('Effective rate');
  expect(texts()).toContain('not counted');
  expect(texts()).toContain('reached its stop deadline');
  expect(texts()).not.toContain('Including current session');
});
it('shows loading, errors and cache labels without claiming a failed read is a zero total', async () => {
  mockMonthly.report = null;
  mockMonthly.error = 'Could not load all work for this month.';
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
  expect(texts()).toContain('Loading work hours');
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

it('narrows the list to a tapped calendar day and back to the whole month', async () => {
  await open();
  // The saved record started 20 Oct 11:00 UTC, so it belongs to day 20.
  await pressLabel('20 October 2026, 1h 0m');
  expect(texts()).toContain('Tuesday 20 October');
  expect(texts()).toContain('11:00 AM – 12:00 PM');
  expect(texts()).toContain('Show the whole month');

  await press('Show the whole month');
  expect(texts()).toContain('All sessions');
  expect(texts()).not.toContain('Show the whole month');

  // A day with no work says so instead of showing an empty card.
  await pressLabel('21 October 2026, no work');
  expect(texts()).toContain('No work recorded on this day.');
});
