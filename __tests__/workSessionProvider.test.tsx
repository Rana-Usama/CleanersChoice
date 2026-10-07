import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Alert} from 'react-native';
import {
  WorkSessionProvider,
  useWorkSessions,
} from '../src/components/work/WorkSessionProvider';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

const BASE = Date.UTC(2026, 9, 7, 9);
let mockUser: any;
let mockSessions: any[];
let mockSubscription: ((sessions: any[]) => void) | null;
let mockDialog: any;
let mockSequence = 0;
const mockStorage = new Map();
const mockOperate = jest.fn();
const mockReminder = jest.fn().mockResolvedValue(true);
jest.mock('react-native', () => ({
  Alert: {alert: jest.fn()},
  AppState: {
    currentState: 'active',
    addEventListener: () => ({remove: jest.fn()}),
  },
}));
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {uid: 'cleaner'},
  onAuthStateChanged: (fn: any) => {
    fn({uid: 'cleaner'});
    return jest.fn();
  },
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: () => ({
    doc: () => ({
      onSnapshot: (fn: any) => {
        fn({exists: true, data: () => mockUser});
        return jest.fn();
      },
    }),
  }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (key: string) => mockStorage.get(key) || null,
  setItem: async (key: string, value: string) => {
    mockStorage.set(key, value);
  },
  removeItem: async (key: string) => {
    mockStorage.delete(key);
  },
}));
jest.mock('../src/services/workSessionConfigService', () => ({
  getWorkSessionConfig: async () => ({
    enabled: true,
    graceHours: 3,
    hardCapHours: 12,
    manualEntryMaxAgeDays: 7,
  }),
}));
jest.mock('../src/services/workSessionService', () => ({
  createWorkSessionRequestId: () => `request-${++mockSequence}`,
  getOpenWorkSessions: async () => mockSessions,
  getWorkSession: async (id: string) =>
    mockSessions.find(session => session.id === id) || null,
  hasWorkSessionHistory: async () => true,
  operateWorkSession: (request: any) => mockOperate(request),
  subscribeOpenWorkSessions: (fn: any) => {
    mockSubscription = fn;
    fn([...mockSessions]);
    return jest.fn();
  },
}));
jest.mock('../src/services/workSessionReminders', () => ({
  syncWorkReminder: (...args: any[]) => mockReminder(...args),
}));
jest.mock('../src/components/work/WorkSessionDialog', () => ({
  WorkSessionDialog: (props: any) => {
    mockDialog = props;
    return null;
  },
}));

let context: ReturnType<typeof useWorkSessions>;
let renderer: Renderer.ReactTestRenderer;
const Consumer = () => {
  context = useWorkSessions();
  return null;
};
const emit = (status: string, endedAt = BASE + 3600000) => {
  mockSessions = mockSessions.map(session => ({
    ...session,
    status,
    endedAt,
    durationMs: status === 'confirmed' ? endedAt - session.startedAt : 0,
  }));
  mockSubscription?.(
    mockSessions.filter(session =>
      ['active', 'needsReview'].includes(session.status),
    ),
  );
};
beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(BASE + 3600000);
  jest.clearAllMocks();
  mockStorage.clear();
  mockSequence = 0;
  mockSubscription = null;
  mockUser = {
    role: 'Cleaner',
    subscriptionEndDate: BASE + 24 * 3600000,
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
  };
  mockSessions = [
    {
      id: 'session',
      cleanerId: 'cleaner',
      status: 'active',
      source: 'clock',
      jobId: null,
      startedAt: BASE,
      endedAt: null,
      expectedEndAt: null,
      autoStopAt: BASE + 12 * 3600000,
      timingConfig: {graceHours: 3, hardCapHours: 12},
      reportingTimeZone: 'UTC',
    },
  ];
  mockOperate.mockImplementation(async request => {
    if (request.action === 'clockOut' || request.action === 'confirm')
      emit('confirmed', request.endedAt);
    if (request.action === 'requestReview') emit('needsReview');
    if (request.action === 'discard') emit('discarded');
    if (
      request.action === 'reconcile' &&
      Date.now() >= mockSessions[0].autoStopAt
    )
      emit('needsReview');
    return {sessionId: 'session', status: mockSessions[0].status};
  });
  (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) =>
    buttons[1].onPress(),
  );
  await act(async () => {
    renderer = Renderer.create(
      <WorkSessionProvider>
        <Consumer />
      </WorkSessionProvider>,
    );
  });
  mockOperate.mockClear();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  jest.useRealTimers();
});

it('sends a correction with the captured record revision and reason', async () => {
  const saved = {...mockSessions[0], status: 'confirmed', endedAt: BASE + 3600000, revision: 7};
  mockOperate.mockResolvedValueOnce({sessionId: 'session', status: 'confirmed'});
  let finished!: Promise<boolean>;
  await act(async () => {finished = context.edit(saved);});
  expect(mockDialog.state.editing).toBe(true);
  await act(async () => {await mockDialog.onSave({startedAt: BASE, endedAt: BASE + 1800000, note: 'Finished earlier'});});
  expect(mockOperate).toHaveBeenCalledWith(expect.objectContaining({action: 'edit', expectedRevision: 7, note: 'Finished earlier', endedAt: BASE + 1800000}));
  expect(await finished).toBe(true);
});

it('saves a manual record without confirming it or opening a timer', async () => {
  mockOperate.mockResolvedValueOnce({sessionId: 'manual', status: 'needsReview'});
  let result: any;
  await act(async () => {result = await context.saveManual({startedAt: BASE - 3600000, endedAt: BASE, reportingTimeZone: 'UTC', note: 'Past work'});});
  expect(result.status).toBe('needsReview');
  expect(mockOperate.mock.calls.map(call => call[0].action)).toEqual(['addManual']);
  expect(mockDialog.state).toBeNull();
});

it('saves clock-out before allowing a completion request, and never allows it after a save failure', async () => {
  mockSessions[0].jobId = 'job';
  let allowed = false;
  await act(async () => {
    allowed = await context.beforeJobAction('job', 'complete');
  });
  expect(allowed).toBe(true);
  expect(mockOperate.mock.calls[0][0]).toMatchObject({
    action: 'clockOut',
    sessionId: 'session',
  });
  emit('active');
  mockOperate.mockRejectedValueOnce(new Error('offline'));
  await act(async () => {
    allowed = await context.beforeJobAction('job', 'complete');
  });
  expect(allowed).toBe(false);
});

it('asks for actual times before cancellation, and cancelling the picker keeps the job unchanged', async () => {
  mockSessions[0].jobId = 'job';
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = context.beforeJobAction('job', 'cancel');
  });
  expect(mockDialog.state.kind).toBe('finish');
  expect(mockOperate).not.toHaveBeenCalled();
  await act(async () => {
    mockDialog.onClose();
  });
  expect(await pending).toBe(false);
});

it('confirms the supplied actual finish, rather than server-now, before allowing cancellation', async () => {
  mockSessions[0].jobId = 'job';
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = context.beforeJobAction('job', 'cancel');
  });
  await act(async () => {
    await mockDialog.onSave({startedAt: BASE, endedAt: BASE + 1800000});
  });
  expect(await pending).toBe(true);
  expect(mockOperate.mock.calls.map(call => call[0].action)).toEqual([
    'requestReview',
    'confirm',
  ]);
  expect(mockOperate.mock.calls[1][0].endedAt).toBe(BASE + 1800000);
});

it('keeps an unknown clock-out retry unchanged and exposes it for retry instead of sending a second mutation', async () => {
  mockOperate.mockRejectedValueOnce(new Error('timeout'));
  await act(async () => {
    await context.stop();
  });
  expect(context.pending).toBe(true);
  const first = mockOperate.mock.calls[0][0];
  await act(async () => {
    await context.retry();
  });
  expect(mockOperate.mock.calls[1][0]).toEqual(first);
  expect(context.pending).toBe(false);
});

it('ordinary subscription expiry blocks starting work while retaining finish access', async () => {
  mockUser.subscriptionEndDate = BASE;
  await act(async () => {
    renderer.update(
      <WorkSessionProvider>
        <Consumer />
      </WorkSessionProvider>,
    );
  });
  await act(async () => {
    await context.start();
  });
  expect(mockOperate).not.toHaveBeenCalled();
  await act(async () => {
    await context.stop();
  });
  expect(mockOperate.mock.calls[0][0].action).toBe('clockOut');
});

it('a late clock-out opens review and waits for actual-time confirmation', async () => {
  mockOperate.mockImplementationOnce(async () => {
    emit('needsReview');
    return {sessionId: 'session', status: 'needsReview'};
  });
  let finish!: Promise<boolean>;
  await act(async () => {finish = context.stop();});
  expect(mockDialog.state.kind).toBe('finish');
  expect(mockSessions[0].durationMs).toBe(0);
  await act(async () => {await mockDialog.onSave({startedAt: BASE, endedAt: BASE + 1800000});});
  expect(await finish).toBe(true);
  expect(mockOperate.mock.calls.map(call => call[0].action)).toEqual(['clockOut', 'confirm']);
});

it('Yes keeps the original deadline and does not repeat requests every foreground tick', async () => {
  await act(async () => {
    mockSessions[0] = {
      ...mockSessions[0],
      expectedEndAt: BASE + 3600000,
      autoStopAt: BASE + 4 * 3600000,
    };
    mockSubscription?.([...mockSessions]);
  });
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(mockDialog.state.kind).toBe('checkIn');
  await act(async () => {
    mockDialog.onContinue();
  });
  expect(mockSessions[0].autoStopAt).toBe(BASE + 4 * 3600000);
  const checks = mockOperate.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(mockOperate.mock.calls).toHaveLength(checks);
  expect(mockSessions[0].status).toBe('active');
});

it('an open Still working prompt cannot extend a timer beyond its saved stop deadline', async () => {
  await act(async () => {
    mockSessions[0] = {
      ...mockSessions[0],
      expectedEndAt: BASE + 3600000,
      autoStopAt: BASE + 3600000 + 30000,
    };
    mockSubscription?.([...mockSessions]);
  });
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(mockDialog.state.kind).toBe('checkIn');
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(mockSessions[0].status).toBe('needsReview');
  expect(mockDialog.state).toBeNull();
  expect(
    mockOperate.mock.calls.every(call => call[0].action === 'reconcile'),
  ).toBe(true);
});
