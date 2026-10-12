import type {Invoice} from '../types/invoice';
import type {JobEarning} from '../types/jobEarning';
import type {WorkSession} from '../types/workSession';
import {
  HOUR_MS,
  validWorkEarnings,
} from '../../functions/src/workSessions/model';
import {
  buildAnnualEarningsSummary,
  getInvoicePaidMonth,
  parseInvoiceAmount,
} from './earningsService';
import {WorkMonth, workTimeInMonth} from '../utils/workMonth';
import {cachedNumberFormatter} from '../utils/intlCache';

export type MonthWorkRecord = {
  session: WorkSession;
  confirmedMs: number;
  pendingMs: number;
  runningMs: number;
  crossesMonth: boolean;
};
export type MonthWorkJob = {
  key: string;
  jobId: string | null;
  title: string;
  confirmedMs: number;
  pendingMs: number;
  runningMs: number;
  collected: number;
  /** Accrued value: hourly from sessions, fixed price from the job ledger. */
  earned: number;
  /** Confirmed time on this job that has no usable rate - never counted as $0. */
  unratedMs: number;
  paidInvoiceCount: number;
  sessionIds: string[];
  hasInvoice: boolean;
};
export type WorkMonthlyReport = {
  confirmedMs: number;
  pendingMs: number;
  pendingCount: number;
  runningMs: number;
  collected: number;
  /** Hourly sessions: in-month confirmed hours x the rate saved at clock-in. */
  earnedHourly: number;
  /** Fixed-price jobs completed this month, counted once each. */
  earnedJobs: number;
  /**
   * Legacy general work valued at the saved default rate. Excluded from Earned:
   * only explicitly reported general-work totals enter the main amount.
   */
  earnedGeneral: number;
  /** Explicit general-work totals, counted once in the finish month. */
  earnedGeneralReported: number;
  /** Confirmed hourly, completed fixed-price jobs and reported general work. */
  earned: number;
  /** Confirmed hourly/general time with no saved rate. Shown, never valued. */
  unratedMs: number;
  /** Per job, max(0, earned - collected), summed. Work done, not yet paid. */
  awaitingPayment: number;
  effectiveRate: number | null;
  includingRunningMs: number;
  provisionalRate: number | null;
  jobs: MonthWorkJob[];
  records: MonthWorkRecord[];
  paidInvoices: Invoice[];
  outstandingInvoices: Invoice[];
  outstandingTotal: number;
  jobsWithoutInvoice: MonthWorkJob[];
  reportingZones: string[];
  overdue: boolean;
  invalidRecordCount: number;
};
export const workCurrency = (amount: number): string =>
  `$${cachedNumberFormatter('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
/** Two-decimal rounding so repeated accrual does not drift on float maths. */
const round = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const effective = (collected: number, duration: number) =>
  duration > 0 ? collected / (duration / HOUR_MS) : null;

export const buildWorkMonthlyReport = (
  sessions: WorkSession[],
  invoices: Invoice[],
  month: WorkMonth,
  now: number,
  // Fixed-price earnings arrive as month-scoped rows, exactly like invoices,
  // so this stays a pure function and keeps working from cache and offline.
  jobEarnings: JobEarning[] = [],
): WorkMonthlyReport => {
  // Money stays on the existing paidAt/device-local ledger, including legacy date representations.
  const earnings = buildAnnualEarningsSummary(invoices, month.year);
  const paidInvoices = earnings.paidInvoices.filter(
    invoice => getInvoicePaidMonth(invoice) === month.month,
  );
  const collected = earnings.monthly[month.month].total;
  const jobs = new Map<string, MonthWorkJob>();
  const records: MonthWorkRecord[] = [];
  const zones = new Set<string>();
  let invalidRecordCount = 0;
  let overdue = false;
  let earnedHourly = 0;
  let earnedGeneral = 0;
  let earnedGeneralReported = 0;
  let earnedJobs = 0;
  let unratedMs = 0;
  const ensureJob = (jobId: string | null, title: string) => {
    const key = jobId ? `job:${jobId}` : 'general';
    let job = jobs.get(key);
    if (!job) {
      job = {
        key,
        jobId,
        title,
        confirmedMs: 0,
        pendingMs: 0,
        runningMs: 0,
        collected: 0,
        earned: 0,
        unratedMs: 0,
        paidInvoiceCount: 0,
        sessionIds: [],
        hasInvoice: false,
      };
      jobs.set(key, job);
    }
    return job;
  };
  // Readers supply unique documents; guard against an accidental duplicated page/list merge as well.
  const seen = new Set<string>();
  for (const session of sessions) {
    if (seen.has(session.id) || session.status === 'discarded') {
      continue;
    }
    seen.add(session.id);
    const end =
      session.status === 'active'
        ? Math.min(now, session.autoStopAt)
        : session.endedAt;
    if (
      end === null ||
      !Number.isSafeInteger(end) ||
      !Number.isSafeInteger(session.startedAt) ||
      end <= session.startedAt
    ) {
      continue;
    }
    let duration: number;
    try {
      duration = workTimeInMonth(
        session.startedAt,
        end,
        month,
        session.reportingTimeZone,
      );
    } catch {
      invalidRecordCount += 1;
      continue;
    }
    if (!duration) {
      continue;
    }
    const needsRecovery =
      session.status === 'active' && now >= session.autoStopAt;
    overdue ||= needsRecovery;
    const record: MonthWorkRecord = {
      session,
      confirmedMs: session.status === 'confirmed' ? duration : 0,
      pendingMs:
        session.status === 'needsReview' || needsRecovery ? duration : 0,
      runningMs: session.status === 'active' && !needsRecovery ? duration : 0,
      crossesMonth: duration < end - session.startedAt,
    };
    records.push(record);
    zones.add(session.reportingTimeZone);
    const job = ensureJob(
      session.jobId,
      session.jobSnapshot?.title ||
        (session.jobId ? 'Saved job' : 'General work'),
    );
    job.confirmedMs += record.confirmedMs;
    job.pendingMs += record.pendingMs;
    job.runningMs += record.runningMs;
    job.sessionIds.push(session.id);

    /*
      Accrual, confirmed hours only - pending and running time is not yet real,
      exactly as it is excluded from the headline hours.

      Hourly values split with in-month hours. Explicit general-work totals
      belong to the finish month; legacy default-rate values remain separate.
      flat/sqft money arrives once from the completed-job ledger below.
    */
    const basis = session.paySnapshot?.basis;
    const rate = session.paySnapshot?.hourlyRate ?? null;
    if (
      !session.jobId &&
      validWorkEarnings(session.expectedEarnings) &&
      record.confirmedMs > 0
    ) {
      // A total belongs to the work record, not to each hour or each month it touches.
      if (workTimeInMonth(end - 1, end, month, session.reportingTimeZone) > 0) {
        earnedGeneralReported = round(
          earnedGeneralReported + session.expectedEarnings,
        );
        job.earned = round(job.earned + session.expectedEarnings);
      }
    } else if (
      (basis === 'hourly' || basis === 'general') &&
      record.confirmedMs > 0
    ) {
      if (rate !== null && rate > 0) {
        const value = round((record.confirmedMs / HOUR_MS) * rate);
        if (basis === 'hourly') {
          earnedHourly += value;
          job.earned = round(job.earned + value);
        } else {
          earnedGeneral += value;
        }
      } else {
        // No rate was available at clock-in. Surfaced as unrated time rather
        // than valued at $0, which would understate what the cleaner is owed.
        unratedMs += record.confirmedMs;
        job.unratedMs += record.confirmedMs;
      }
    }
  }

  /*
    Fixed-price jobs: one row each, counted once, for jobs completed in this
    month. ensureJob attaches it to the job row even when the job has no
    sessions in this month - the money is still this month's.
  */
  const seenEarnings = new Set<string>();
  for (const entry of jobEarnings) {
    if (!entry?.jobId || seenEarnings.has(entry.jobId)) {
      continue;
    }
    /*
      The query range is padded by a day on each side so no row is missed at a
      boundary, so the month test has to happen here or a job completed on the
      1st would be counted in two months.

      Device-local, matching how paid invoices are attributed - money is on the
      device-local ledger, hours are on each record's saved reporting zone.
      That split is already documented on the screen.
    */
    const completed = new Date(entry.completedAt);
    if (
      !Number.isFinite(entry.completedAt) ||
      completed.getFullYear() !== month.year ||
      completed.getMonth() !== month.month
    ) {
      continue;
    }
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    seenEarnings.add(entry.jobId);
    const job = ensureJob(entry.jobId, 'Completed job');
    job.earned = round(job.earned + amount);
    earnedJobs = round(earnedJobs + amount);
  }
  const invoicedJobs = new Set(
    invoices.filter(invoice => invoice.jobId).map(invoice => invoice.jobId),
  );
  for (const invoice of paidInvoices) {
    // An invoice with no job must not be attributed to General work sessions.
    const jobId = invoice.jobId || null;
    const job = jobId
      ? ensureJob(jobId, invoice.jobPostName || 'Invoiced job')
      : (() => {
          let unlinked = jobs.get('unlinkedInvoices');
          if (!unlinked) {
            unlinked = {
              key: 'unlinkedInvoices',
              jobId: null,
              title: 'Invoices without a linked job',
              confirmedMs: 0,
              pendingMs: 0,
              runningMs: 0,
              collected: 0,
              earned: 0,
              unratedMs: 0,
              paidInvoiceCount: 0,
              sessionIds: [],
              hasInvoice: true,
            };
            jobs.set(unlinked.key, unlinked);
          }
          return unlinked;
        })();
    job.collected += parseInvoiceAmount(invoice.price);
    job.paidInvoiceCount += 1;
  }
  const jobRows = Array.from(jobs.values());
  jobRows.forEach(job => {
    if (job.jobId) {
      job.hasInvoice = invoicedJobs.has(job.jobId);
    }
  });
  const confirmedMs = records.reduce((sum, item) => sum + item.confirmedMs, 0);
  const pendingMs = records.reduce((sum, item) => sum + item.pendingMs, 0);
  const runningMs = records.reduce((sum, item) => sum + item.runningMs, 0);
  const outstandingInvoices = invoices.filter(
    invoice => invoice.paymentStatus !== 'paid',
  );
  return {
    confirmedMs,
    pendingMs,
    pendingCount: records.filter(item => item.pendingMs > 0).length,
    runningMs,
    collected,
    earnedHourly: round(earnedHourly),
    earnedJobs: round(earnedJobs),
    earnedGeneral: round(earnedGeneral),
    earnedGeneralReported,
    earned: round(earnedHourly + earnedJobs + earnedGeneralReported),
    unratedMs,
    /*
      Compared per job, not month against month: cash received in October may
      pay for September's work, so `earned - collected` at month level is not a
      meaningful gap. Per job the two refer to the same work, so the difference
      is real. Clamped at 0 so a job paid above its accrued value - or one whose
      ledger row predates the backfill - cannot net off another job's shortfall.
    */
    awaitingPayment: round(
      jobRows.reduce(
        (sum, job) => sum + Math.max(0, round(job.earned - job.collected)),
        0,
      ),
    ),
    effectiveRate: effective(collected, confirmedMs),
    includingRunningMs: confirmedMs + runningMs,
    provisionalRate:
      runningMs > 0 ? effective(collected, confirmedMs + runningMs) : null,
    jobs: jobRows.sort(
      (a, b) =>
        b.confirmedMs - a.confirmedMs ||
        b.collected - a.collected ||
        a.key.localeCompare(b.key),
    ),
    records: records.sort(
      (a, b) =>
        b.session.startedAt - a.session.startedAt ||
        a.session.id.localeCompare(b.session.id),
    ),
    paidInvoices,
    outstandingInvoices,
    outstandingTotal: outstandingInvoices.reduce(
      (sum, invoice) => sum + parseInvoiceAmount(invoice.price),
      0,
    ),
    // Conservative job-level coverage: any invoice (paid or unpaid, any month) excludes the whole job.
    jobsWithoutInvoice: jobRows.filter(
      job => job.jobId && job.confirmedMs > 0 && !job.hasInvoice,
    ),
    reportingZones: Array.from(zones).sort(),
    overdue,
    invalidRecordCount,
  };
};
