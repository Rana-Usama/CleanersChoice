import {todayWorkJobs, TodayWorkJob} from '../src/utils/workTodayJobs';
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
const now = Date.parse('2026-10-10T02:00:00Z');
const job = (
  id: string,
  time: string,
  extra: Partial<TodayWorkJob> = {},
): TodayWorkJob => ({
  id,
  status: 'confirmed',
  confirmedCleaner: 'cleaner',
  scheduleTimeZone: 'America/Los_Angeles',
  scheduledStartAt: {toDate: () => new Date(time)},
  ...extra,
});
it('uses the job’s calendar day near midnight and orders clock-in cards by schedule', () => {
  expect(
    todayWorkJobs(
      [
        job('later', '2026-10-10T05:00:00Z'),
        job('tomorrow', '2026-10-10T09:00:00Z'),
        job('earlier', '2026-10-09T18:00:00Z'),
        job('yesterday', '2026-10-09T06:00:00Z'),
      ],
      'cleaner',
      now,
    ).map(value => value.id),
  ).toEqual(['earlier', 'later']);
});
it('excludes jobs for other cleaners, unconfirmed jobs and missing schedules', () => {
  expect(
    todayWorkJobs(
      [
        job('other', '2026-10-10T02:00:00Z', {confirmedCleaner: 'other'}),
        job('completed', '2026-10-10T02:00:00Z', {status: 'completed'}),
        job('missing', '', {scheduledStartAt: undefined}),
      ],
      'cleaner',
      now,
    ),
  ).toEqual([]);
});
