import {WorkSessionQueue} from '../src/services/workSessionQueue';

let saved: Map<string, string>;
let storage: {getItem: jest.Mock; setItem: jest.Mock; removeItem: jest.Mock};
const draft = {action: 'clockOut' as const, sessionId: 'session'};
const result = {
  sessionId: 'session',
  status: 'confirmed' as const,
  startedAt: 0,
  endedAt: 1000,
  durationMs: 1000,
};
beforeEach(() => {
  saved = new Map();
  storage = {
    getItem: jest.fn(async key => saved.get(key) || null),
    setItem: jest.fn(async (key, value) => {
      saved.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      saved.delete(key);
    }),
  };
});

it('persists before sending and reuses the exact payload after a restart with an uncertain outcome', async () => {
  const send = jest.fn(async request => {
    expect(JSON.parse(saved.get('work-session-operation:cleaner')!)).toEqual(
      request,
    );
    throw Object.assign(new Error('timeout'), {code: 'unavailable'});
  });
  const queue = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'original-id',
    send,
  );
  await expect(queue.run(draft)).rejects.toThrow('timeout');
  const retry = jest.fn().mockResolvedValue(result);
  const restored = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'different-id',
    retry,
  );
  expect(await restored.run()).toEqual(result);
  expect(retry.mock.calls[0][0]).toEqual(send.mock.calls[0][0]);
  expect(await restored.pending()).toBeNull();
});

it('blocks a different mutation while an unknown save is outstanding', async () => {
  const send = jest.fn().mockRejectedValue(new Error('offline'));
  const queue = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'original-id',
    send,
  );
  await expect(queue.run(draft)).rejects.toThrow();
  await expect(
    queue.run({action: 'discard', sessionId: 'session'}),
  ).rejects.toThrow('Retry the unfinished');
  expect(send).toHaveBeenCalledTimes(1);
});

it('isolates unfinished updates by authenticated owner', async () => {
  const send = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(
    new WorkSessionQueue('cleaner', storage, () => 'id-one', send).run(draft),
  ).rejects.toThrow();
  expect(
    await new WorkSessionQueue(
      'other',
      storage,
      () => 'id-two',
      send,
    ).pending(),
  ).toBeNull();
});

it('keeps a successful but unacknowledged operation if local cleanup fails', async () => {
  storage.removeItem.mockRejectedValueOnce(new Error('storage failed'));
  const queue = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'original-id',
    jest.fn().mockResolvedValue(result),
  );
  await expect(queue.run(draft)).rejects.toThrow('storage failed');
  expect((await queue.pending())?.requestId).toBe('original-id');
  await queue.run();
  expect(await queue.pending()).toBeNull();
});

it('clears a definitive server rejection so the user can correct the form', async () => {
  const send = jest
    .fn()
    .mockRejectedValueOnce(
      Object.assign(new Error('overlap'), {code: 'invalid-argument'}),
    )
    .mockResolvedValue(result);
  const queue = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'original-id',
    send,
  );
  await expect(queue.run(draft)).rejects.toThrow('overlap');
  expect(await queue.pending()).toBeNull();
  await queue.run({
    action: 'confirm',
    sessionId: 'session',
    startedAt: 0,
    endedAt: 1000,
  });
});

it('does not send if intent cannot be persisted and serializes simultaneous taps', async () => {
  const send = jest.fn().mockResolvedValue(result);
  storage.setItem.mockRejectedValueOnce(new Error('storage full'));
  const queue = new WorkSessionQueue(
    'cleaner',
    storage,
    () => 'original-id',
    send,
  );
  await expect(queue.run(draft)).rejects.toThrow('storage full');
  expect(send).not.toHaveBeenCalled();
  const first = queue.run(draft);
  await expect(queue.run(draft)).rejects.toThrow('already being saved');
  await first;
  expect(send).toHaveBeenCalledTimes(1);
});
