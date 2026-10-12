import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import App from '../App';

let mockDialogState: any = null;
const mockObservedInsets: any[] = [];

// Keep the real provider and throwing hook; stub only native measurement.
jest.mock(
  'react-native-safe-area-context/lib/commonjs/NativeSafeAreaProvider',
  () => ({
    NativeSafeAreaProvider: 'NativeSafeAreaProvider',
  }),
);
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  initialWindowMetrics: {
    frame: {x: 0, y: 0, width: 390, height: 844},
    insets: {top: 47, bottom: 34, left: 0, right: 0},
  },
}));
jest.mock('../src/components/work/WorkSessionProvider', () => ({
  WorkSessionProvider: ({children}: any) => {
    const React = require('react');
    const {useSafeAreaInsets} = require('react-native-safe-area-context');
    const {
      WorkSessionDialog,
    } = require('../src/components/work/WorkSessionDialog');
    mockObservedInsets.push(useSafeAreaInsets());
    return React.createElement(
      React.Fragment,
      null,
      children,
      React.createElement(WorkSessionDialog, {
        state: mockDialogState,
        busy: false,
        pending: false,
        error: '',
        onClose: jest.fn(),
        onContinue: jest.fn(),
        onFinish: jest.fn(),
        onSave: jest.fn(),
        onRetry: jest.fn(),
      }),
    );
  },
}));
jest.mock('../src/routers/StackNavigator', () => () => null);
jest.mock('../src/redux/Store', () => ({
  __esModule: true,
  default: {},
  hydrateStore: jest.fn(),
}));
jest.mock('react-redux', () => ({Provider: ({children}: any) => children}));
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({children}: any) => children,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
}));
jest.mock('../src/components/AlertProvider', () => ({
  AlertProvider: ({children}: any) => children,
}));
jest.mock('../src/utils/UnreadMessagesContext', () => ({
  UnreadMessagesProvider: ({children}: any) => children,
}));
jest.mock('react-native-toast-message', () => 'Toast');
jest.mock('../src/utils/toastConfig', () => ({toastConfig: {}}));
jest.mock('../src/utils/notificationNavigation', () => ({
  handleNotificationTap: jest.fn(),
}));
jest.mock('react-native-blob-util', () => ({android: {}}));
jest.mock('react-native-date-picker', () => 'DatePicker');
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: null,
  onAuthStateChanged: () => jest.fn(),
}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('@react-native-firebase/messaging', () => {
  const messaging: any = () => ({
    requestPermission: async () => 0,
    onMessage: () => jest.fn(),
    onTokenRefresh: () => jest.fn(),
  });
  messaging.AuthorizationStatus = {AUTHORIZED: 1, PROVISIONAL: 2};
  return messaging;
});
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  EventType: {PRESS: 1},
  default: {
    getInitialNotification: async () => null,
    onForegroundEvent: () => jest.fn(),
  },
}));

let renderer: Renderer.ReactTestRenderer;
beforeEach(() => {
  mockDialogState = null;
  mockObservedInsets.length = 0;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
});

it('provides real safe-area context to the work provider and its hidden and open dialogs', async () => {
  await act(async () => {
    renderer = Renderer.create(<App />);
  });
  expect(mockObservedInsets.at(-1)).toEqual({
    top: 47,
    bottom: 34,
    left: 0,
    right: 0,
  });
  mockDialogState = {
    kind: 'finish',
    session: {
      id: 'record',
      status: 'needsReview',
      source: 'manualCleaner',
      startedAt: Date.now() - 7200000,
      endedAt: Date.now() - 3600000,
      autoStopAt: Date.now(),
      reportingTimeZone: 'UTC',
      timingConfig: {hardCapHours: 12},
    },
  };
  await act(async () => renderer.update(<App />));
  expect(renderer.root.findAllByType('DatePicker' as any)).not.toHaveLength(0);
  mockDialogState = {...mockDialogState, kind: 'earnings'};
  await act(async () => renderer.update(<App />));
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Expected earnings'}).length).toBeGreaterThan(0);
});

it('propagates changed native insets to the work provider', async () => {
  await act(async () => {
    renderer = Renderer.create(<App />);
  });
  const provider = renderer.root.findByType('NativeSafeAreaProvider' as any);
  await act(async () =>
    provider.props.onInsetsChange({
      nativeEvent: {
        frame: {x: 0, y: 0, width: 844, height: 390},
        insets: {top: 0, bottom: 21, left: 47, right: 47},
      },
    }),
  );
  expect(mockObservedInsets.at(-1)).toEqual({
    top: 0,
    bottom: 21,
    left: 47,
    right: 47,
  });
});
