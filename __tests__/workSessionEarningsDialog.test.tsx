import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {TouchableOpacity} from 'react-native';
import {GeneralWorkEarningsDialog} from '../src/components/work/GeneralWorkEarningsDialog';
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 47, bottom: 34, left: 0, right: 0}),
}));
const save = jest.fn();
const retry = jest.fn();
let renderer: Renderer.ReactTestRenderer;
const open = async (pending = false) => {
  await act(async () => {
    renderer = Renderer.create(
      <GeneralWorkEarningsDialog
        session={
          {id: 'record', workName: 'Office', expectedEarnings: 80} as any
        }
        busy={false}
        pending={pending}
        error=""
        onClose={jest.fn()}
        onRetry={retry}
        onSave={save}
      />,
    );
  });
};
const press = async (label: string) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityLabel === label)!;
  await act(async () => {
    await button.props.onPress();
  });
};
beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});
it('preloads the total, rejects empty and invalid values, and saves money only', async () => {
  await open();
  const input = renderer.root.findByProps({
    accessibilityLabel: 'Expected earnings',
  });
  expect(input.props.value).toBe('80.00');
  for (const value of ['', '-1', '12.345']) {
    await act(async () => input.props.onChangeText(value));
    await press('Save earnings');
    expect(save).not.toHaveBeenCalled();
  }
  await act(async () => input.props.onChangeText('0'));
  await press('Save earnings');
  expect(save).toHaveBeenCalledWith({expectedEarnings: 0});
});
it('locks the amount while an uncertain save is pending and retries that saved action', async () => {
  await open(true);
  expect(
    renderer.root.findByProps({accessibilityLabel: 'Expected earnings'}).props
      .editable,
  ).toBe(false);
  await press('Retry unfinished save');
  expect(retry).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});
