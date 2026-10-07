import {formatExpectedHours, getJobScheduledStart, parseDefaultHourlyRate, parseExpectedHours} from '../src/utils/workTiming';

it.each(['', ' ', null, undefined, 0, -1, 12.01, '2h', '1.2.3', '1e1', Infinity, '0.001'])(
  'rejects missing or unsafe expected hours: %p', value => {
    expect(parseExpectedHours(value)).toBeNull();
  });

it('supports fractional durations and the exact hard cap', () => {
  expect(parseExpectedHours(' 2.5 ')).toBe(2.5);
  expect(parseExpectedHours(12)).toBe(12);
  expect(formatExpectedHours(2.5)).toBe('2h 30m');
  expect(formatExpectedHours(undefined)).toBe('Not specified');
});

it('does not turn malformed money or a zero rate into a fallback wage', () => {
  for (const value of ['', '0', '-25', '$25', '2.5.5', '25.999']) {
    expect(parseDefaultHourlyRate(value)).toBeNull();
  }
  expect(parseDefaultHourlyRate('25.50')).toBe(25.5);
});

it('uses the normalized instant even when a legacy schedule string differs', () => {
  const date = new Date('2026-10-07T21:00:00Z');
  expect(getJobScheduledStart({scheduledStartAt: {toDate: () => date}, createdAt: '2026-10-07  09:00 AM'}))
    .toEqual(date);
});

it('parses legacy AM/PM schedules without fabricating a missing date', () => {
  expect(getJobScheduledStart({createdAt: '2026-10-07  09:00 PM'})?.getHours()).toBe(21);
  expect(getJobScheduledStart({createdAt: '2026-10-07 09:00 AM'})?.getHours()).toBe(9);
  expect(getJobScheduledStart({})).toBeNull();
  expect(getJobScheduledStart({createdAt: '2026-02-30  09:00 AM'})).toBeNull();
});
