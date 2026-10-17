import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {WorkSessionDialog} from '../src/components/work/WorkSessionDialog';
import {ManualTimeFields} from '../src/components/work/ManualTimeFields';
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 24, bottom: 16, left: 0, right: 0}),
}));
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('react-native-date-picker', () => 'DatePicker');
jest.mock('react-native-responsive-fontsize', () => ({
  RFPercentage: (value: number) => value,
}));
const NOW = Date.UTC(2026, 9, 7, 9);
let renderer: Renderer.ReactTestRenderer;
const save = jest.fn();
const session: any = {
  id: 'session',
  status: 'needsReview',
  source: 'clock',
  startedAt: NOW - 8 * 3600000,
  endedAt: NOW,
  autoStopAt: NOW,
  reportingTimeZone: 'UTC',
  note: '',
  stopReason: 'deadline',
  timingConfig: {hardCapHours: 12},
};
const open = async (editing = false) => {
  await act(async () => {
    renderer = Renderer.create(
      <WorkSessionDialog
        state={{
          kind: 'finish',
          session: {...session, status: editing ? 'confirmed' : 'needsReview'},
          editing,
        }}
        busy={false}
        pending={false}
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
const press = async (label: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(item =>
      item
        .findAllByType(Text)
        .some(
          text =>
            (Array.isArray(text.props.children)
              ? text.props.children.join('')
              : text.props.children) === label,
        ),
    )!;
  await act(async () => {
    await button.props.onPress();
  });
};
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
  save.mockReset().mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  jest.useRealTimers();
});
it('previews a quick duration but only saves after explicit confirmation', async () => {
  await open();
  await press('4h');
  expect(save).not.toHaveBeenCalled();
  expect(renderer.root.findByType(ManualTimeFields).props.value.endedAt).toBe(
    NOW - 4 * 3600000,
  );
  await press('Confirm these times');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      startedAt: session.startedAt,
      endedAt: NOW - 4 * 3600000,
      discard: false,
    }),
  );
});
it('requires a correction reason and gives discard a separate explicit action', async () => {
  await open(true);
  await press('Save corrected times');
  expect(save).not.toHaveBeenCalled();
  const fields = renderer.root.findByType(ManualTimeFields);
  await act(async () => {
    fields.props.onChange({...fields.props.value, note: 'Corrected finish'});
  });
  await press('Save corrected times');
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({note: 'Corrected finish', discard: false}),
  );
  save.mockClear();
  await press('Discard this record instead');
  expect(save).not.toHaveBeenCalled();
  await press('Discard record');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({discard: true}));
});
it('opens a discard confirmation without saving until the cleaner confirms', async () => {
  await open();
  await act(async () => {
    renderer.update(
      <WorkSessionDialog
        state={{kind: 'finish', session, initialDiscard: true}}
        busy={false}
        pending={false}
        error=""
        onClose={jest.fn()}
        onContinue={jest.fn()}
        onFinish={jest.fn()}
        onRetry={jest.fn()}
        onSave={save}
      />,
    );
  });
  expect(save).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(ManualTimeFields)).toHaveLength(0);
  await press('Discard record');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({discard: true}));
});
