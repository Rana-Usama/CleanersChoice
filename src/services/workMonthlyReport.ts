import type {Invoice} from '../types/invoice';
import type {WorkSession} from '../types/workSession';
import {HOUR_MS} from '../../functions/src/workSessions/model';
import {
  buildAnnualEarningsSummary,
  getInvoicePaidMonth,
  parseInvoiceAmount,
} from './earningsService';
import {WorkMonth, workTimeInMonth} from '../utils/workMonth';

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
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const effective = (collected: number, duration: number) =>
  duration > 0 ? collected / (duration / HOUR_MS) : null;

export const buildWorkMonthlyReport = (
  sessions: WorkSession[],
  invoices: Invoice[],
  month: WorkMonth,
  now: number,
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
