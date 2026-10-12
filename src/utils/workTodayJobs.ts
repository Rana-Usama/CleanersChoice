import {cachedDateFormatter, isValidTimeZone} from './intlCache';
import {deviceWorkTimeZone} from './workSessionFlow';
import {getJobScheduledStart} from './workTiming';

export interface TodayWorkJob {
  id: string;
  title?: string;
  confirmedCleaner?: string;
  status?: string;
  createdAt?: unknown;
  scheduledStartAt?: {toDate(): Date};
  scheduleTimeZone?: string;
  expectedHours?: number;
  location?: {name?: string};
  priceRange?: string;
}

/** Compare days in the job's saved zone, including legacy scheduled dates. */
export const todayWorkJobs = (jobs: TodayWorkJob[], uid: string, now: number) =>
  jobs
    .filter(job => {
      if (job.confirmedCleaner !== uid || job.status !== 'confirmed') {
        return false;
      }
      const start = getJobScheduledStart(job);
      if (!start) {
        return false;
      }
      const timeZone =
        job.scheduleTimeZone && isValidTimeZone(job.scheduleTimeZone)
          ? job.scheduleTimeZone
          : deviceWorkTimeZone();
      const day = cachedDateFormatter('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return day.format(start) === day.format(new Date(now));
    })
    .sort(
      (a, b) =>
        getJobScheduledStart(a)!.getTime() - getJobScheduledStart(b)!.getTime(),
    );
