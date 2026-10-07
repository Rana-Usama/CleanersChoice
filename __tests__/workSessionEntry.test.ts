import {
  DEFAULT_WORK_SESSION_CONFIG,
  HOUR_MS,
} from '../functions/src/workSessions/model';
import {
  manualWorkAvailable,
  quickWorkTimes,
  workIntervalError,
} from '../src/utils/workSessionEntry';
const NOW = Date.UTC(2026, 9, 7, 9);
const config = {...DEFAULT_WORK_SESSION_CONFIG, enabled: true};

it('allows an explicit overnight interval and rejects reversing its dates', () => {
  const startedAt = Date.UTC(2026, 9, 6, 23),
    endedAt = Date.UTC(2026, 9, 7, 3);
  expect(workIntervalError({startedAt, endedAt}, config, NOW)).toBe('');
  expect(
    workIntervalError({startedAt: endedAt, endedAt: startedAt}, config, NOW),
  ).toContain('finish after start');
});
it('restricts new manual work by age, entitlement, future time and the saved cap', () => {
  const user = {subscriptionEndDate: NOW - HOUR_MS};
  expect(manualWorkAvailable(config, user, NOW)).toBe(true);
  expect(manualWorkAvailable({...config, enabled: false}, user, NOW)).toBe(
    false,
  );
  expect(
    manualWorkAvailable(
      config,
      {subscriptionEndDate: NOW - 8 * 24 * HOUR_MS},
      NOW,
    ),
  ).toBe(false);
  expect(
    workIntervalError(
      {
        startedAt: NOW - 8 * 24 * HOUR_MS,
        endedAt: NOW - 8 * 24 * HOUR_MS + HOUR_MS,
      },
      config,
      NOW,
      user,
      true,
    ),
  ).toContain('last 7 days');
  expect(
    workIntervalError(
      {startedAt: NOW - 2 * HOUR_MS, endedAt: NOW},
      config,
      NOW,
      user,
      true,
    ),
  ).toContain('subscription');
  expect(
    workIntervalError(
      {startedAt: NOW - 2 * HOUR_MS, endedAt: NOW - HOUR_MS},
      config,
      NOW,
      user,
      true,
    ),
  ).toBe('');
  expect(
    workIntervalError({startedAt: NOW, endedAt: NOW + HOUR_MS}, config, NOW),
  ).toContain('future');
  expect(
    workIntervalError(
      {startedAt: NOW - 13 * HOUR_MS, endedAt: NOW},
      config,
      NOW,
    ),
  ).toContain('12 hours');
});
it('bases quick choices on the recorded start and disables future or capped choices', () => {
  const session: any = {startedAt: NOW - 6 * HOUR_MS, timingConfig: config};
  expect(quickWorkTimes(session, 4, NOW)).toEqual({
    startedAt: session.startedAt,
    endedAt: NOW - 2 * HOUR_MS,
  });
  expect(quickWorkTimes(session, 8, NOW)).toBeNull();
  session.timingConfig = {...config, hardCapHours: 3};
  expect(quickWorkTimes(session, 4, NOW)).toBeNull();
});
