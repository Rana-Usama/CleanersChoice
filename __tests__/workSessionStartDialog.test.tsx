import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  WorkDialogState,
  WorkSessionDialog,
} from '../src/components/work/WorkSessionDialog';
import {workSessionTitle} from '../src/utils/workSessionFlow';

let mockDimensions = {width: 390, height: 844, scale: 3, fontScale: 1};
jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  Object.defineProperty(native, 'useWindowDimensions', {
    configurable: true,
    value: () => mockDimensions,
  });
  return native;
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 24, bottom: 34, left: 0, right: 0}),
}));
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('react-native-date-picker', () => 'DatePicker');
jest.mock('react-native-responsive-fontsize', () => ({
  RFPercentage: (v: number) => v,
}));

const NOW = Date.UTC(2026, 9, 10, 9);
const config = {
  enabled: true,
  graceHours: 3,
  hardCapHours: 12,
  manualEntryMaxAgeDays: 7,
};
const save = jest.fn();
let renderer: Renderer.ReactTestRenderer;
const open = async (
  extra: Partial<Extract<WorkDialogState, {kind: 'start'}>> = {},
  pending = false,
) => {
  await act(async () => {
    renderer = Renderer.create(
      <WorkSessionDialog
        state={{
          kind: 'start',
          title: 'General work',
          reportingTimeZone: 'America/New_York',
          expectedEndAt: null,
          config,
          ...extra,
        }}
        busy={false}
        pending={pending}
        error=""
        onClose={jest.fn()}
        onContinue={jest.fn()}
        onFinish={jest.fn()}
        onRetry={jest.fn()}
        onSave={save}
      />,
    );
  });
};
const text = () =>
  renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
const name = () => renderer.root.findByProps({accessibilityLabel: 'Work name'});
const amount = () => renderer.root.findByProps({accessibilityLabel: 'Expected earnings'});
const press = async (label: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(
      node =>
        node.props.accessibilityLabel === label ||
        node.findAllByType(Text).some(child => child.props.children === label),
    )!;
  await act(async () => {
    await button.props.onPress();
  });
};
const selectEnd = async (end: number) => {
  await press('Select end time');
  const picker = renderer.root.findByType('DatePicker' as any);
  expect(picker.props.open).toBe(true);
  await act(async () => {
    picker.props.onConfirm(new Date(end));
  });
};
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
  save.mockReset().mockResolvedValue(undefined);
  mockDimensions = {width: 390, height: 844, scale: 3, fontScale: 1};
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.useRealTimers();
});

it('requires a name, hides the timezone field and submits a named live timer with a planned end', async () => {
  await open();
  expect(text()).toContain('Start time');
  expect(text()).toContain('End time');
  expect(text()).not.toContain('General work');
  expect(text()).not.toContain('timezone');
  await press('Clock in');
  expect(save).not.toHaveBeenCalled();
  expect(text()).toContain('Enter a name');
  await act(async () => {
    name().props.onChangeText('  Office deep clean  ');
  });
  await selectEnd(NOW + 2 * 3600000);
  expect(text()).not.toContain('Now');
  expect(text()).not.toContain('Choose time');
  expect(text()).not.toContain('Optional');
  await press('Clock in');
  expect(save).toHaveBeenCalledWith({
    workName: 'Office deep clean',
    reportingTimeZone: 'America/New_York',
    startedAt: NOW,
    plannedFinishAt: NOW + 2 * 3600000,
  });
  expect(save.mock.calls[0][0].startedAt).toBe(NOW);
});

it('refuses a stale or over-cap end', async () => {
  await open();
  await act(async () => {
    name().props.onChangeText('Cleaning');
  });
  for (const end of [NOW - 60000, NOW + 13 * 3600000]) {
    await selectEnd(end);
    await press('Clock in');
    expect(save).not.toHaveBeenCalled();
    expect(text()).toContain('End time must');
  }
});

it('uses a selected past start and anchors the end limit to that start', async () => {
  await open();
  await act(async () => {
    name().props.onChangeText('Cleaning');
  });
  await press('Select start time');
  const picker = renderer.root.findByType('DatePicker' as any);
  expect(picker.props.title).toBe('Start time');
  expect(picker.props.maximumDate.getTime()).toBe(NOW);
  await act(async () => {
    picker.props.onConfirm(new Date(NOW - 11.5 * 3600000));
  });
  await press('Clock in');
  expect(save).toHaveBeenCalledWith({
    workName: 'Cleaning',
    reportingTimeZone: 'America/New_York',
    startedAt: NOW - 11.5 * 3600000,
    plannedFinishAt: NOW + 0.5 * 3600000,
  });
});

it.each([NOW + 60000, NOW - 12 * 3600000])(
  'refuses a future or expired live start: %p',
  async start => {
    await open();
    await act(async () => {
      name().props.onChangeText('Cleaning');
    });
    await press('Select start time');
    await act(async () => {
      renderer.root
        .findByType('DatePicker' as any)
        .props.onConfirm(new Date(start));
    });
    await press('Clock in');
    expect(save).not.toHaveBeenCalled();
    expect(text()).toContain('Select a current or past start');
  },
);

it('retains a linked job name and scheduled finish without sending overrides', async () => {
  await open({
    jobId: 'job',
    title: 'Sandra’s house',
    expectedEndAt: NOW + 2 * 3600000,
  });
  expect(name().props.value).toBe('Sandra’s house');
  expect(name().props.editable).toBe(false);
  expect(text()).not.toContain('Job schedule');
  expect(
    renderer.root.findByProps({accessibilityLabel: 'Select end time'}).props
      .disabled,
  ).toBe(true);
  await press('Clock in');
  expect(save).toHaveBeenCalledWith({
    reportingTimeZone: 'America/New_York',
    startedAt: NOW,
  });
});

it('requires a revised end for an overdue job and retains the original start when adding a plan', async () => {
  await open({jobId: 'job', title: 'House', expectedEndAt: NOW - 4 * 3600000});
  await selectEnd(NOW + 2 * 3600000);
  await press('Clock in');
  expect(save).toHaveBeenCalledWith({
    reportingTimeZone: 'America/New_York',
    startedAt: NOW,
    plannedFinishAt: NOW + 2 * 3600000,
  });
  await act(async () => renderer.unmount());
  await open({
    existingSessionId: 'session',
    actualStartedAt: NOW - 3600000,
    title: 'Office deep clean',
    hardCapAt: NOW + 60000,
  });
  expect(name().props.value).toBe('Office deep clean');
  expect(name().props.editable).toBe(false);
  await press('Save planned finish');
  expect(save).toHaveBeenLastCalledWith({
    reportingTimeZone: 'America/New_York',
    plannedFinishAt: NOW + 60000,
  });
});

it.each([
  {width: 320, fontScale: 1},
  {width: 390, fontScale: 1.6},
])(
  'stacks time fields for narrow screens or larger text: %p',
  async dimensions => {
    mockDimensions = {...mockDimensions, ...dimensions};
    await open();
    const row = renderer.root.findAllByType(View).find(node => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.gap === 12 && style?.alignItems === 'stretch';
    });
    expect(StyleSheet.flatten(row!.props.style).flexDirection).toBe('column');
  },
);

it('locks fields during a pending save and shows the retry action', async () => {
  await open({}, true);
  expect(name().props.editable).toBe(false);
  expect(
    renderer.root.findByProps({accessibilityLabel: 'Select end time'}).props
      .disabled,
  ).toBe(true);
  expect(text()).toContain('Retry unfinished save');
});

it('handles a timer cap expiring while the finish planner is open', async () => {
  await open({
    existingSessionId: 'session',
    actualStartedAt: NOW - 11 * 3600000,
    title: 'Cleaning',
    hardCapAt: NOW + 60000,
  });
  jest.setSystemTime(NOW + 120000);
  await press('Select end time');
  expect(text()).toContain('reached its stop deadline');
  const picker = renderer.root.findByType('DatePicker' as any);
  expect(picker.props.open).toBe(false);
  expect(picker.props.minimumDate.getTime()).toBeLessThanOrEqual(
    picker.props.maximumDate.getTime(),
  );
  await press('Save planned finish');
  expect(save).not.toHaveBeenCalled();
});

it('displays saved names while retaining job titles and legacy record fallbacks', () => {
  expect(workSessionTitle({workName: 'Office deep clean'} as any)).toBe(
    'Office deep clean',
  );
  expect(workSessionTitle({} as any)).toBe('General work');
  expect(
    workSessionTitle({
      jobSnapshot: {title: 'House'},
      workName: 'Override',
    } as any),
  ).toBe('House');
});

it('saves an explicit total, rejects invalid money and omits the field for linked jobs', async () => {
  await open();
  await act(async () => name().props.onChangeText('Office'));
  for (const invalid of ['-1', '20.123', 'abc', '1000001']) {
    await act(async () => amount().props.onChangeText(invalid));
    await press('Clock in');
    expect(save).not.toHaveBeenCalled();
    expect(text()).toContain('Enter an amount');
  }
  await act(async () => amount().props.onChangeText('125.50'));
  await press('Clock in');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({expectedEarnings: 125.50, workName: 'Office'}));
  await act(async () => renderer.unmount());
  await open({jobId: 'job', title: 'House', expectedEndAt: NOW + 3600000});
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Expected earnings'})).toHaveLength(0);
});
