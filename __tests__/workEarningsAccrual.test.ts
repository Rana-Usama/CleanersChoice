import {buildWorkMonthlyReport} from '../src/services/workMonthlyReport';
import type {JobEarning} from '../src/types/jobEarning';

const MONTH = {year: 2026, month: 9}; // October 2026
const NOW = Date.UTC(2026, 9, 20, 12);
const HOUR = 3600000;

const session = (over: Record<string, any> = {}): any => ({
  id: 'session-1',
  cleanerId: 'cleaner-1',
  jobId: 'job-1',
  jobSnapshot: {title: 'House'},
  status: 'confirmed',
  source: 'clock',
  startedAt: NOW - 2 * HOUR,
  endedAt: NOW,
  autoStopAt: NOW + HOUR,
  reportingTimeZone: 'UTC',
  paySnapshot: {basis: 'hourly', hourlyRate: 25, rateSource: 'job'},
  ...over,
});

const ledger = (over: Partial<JobEarning> = {}): JobEarning => ({
  jobId: 'job-flat',
  cleanerId: 'cleaner-1',
  basis: 'flat',
  amount: 50,
  completedAt: NOW,
  source: 'jobCompletion',
  revision: 1,
  updatedAt: NOW,
  ...over,
});

const build = (sessions: any[], earnings: JobEarning[] = [], invoices: any[] = []) =>
  buildWorkMonthlyReport(sessions, invoices, MONTH, NOW, earnings);

describe('hourly accrual', () => {
  it('values confirmed hours at the rate saved at clock-in', () => {
    const report = build([session()]);
    expect(report.earnedHourly).toBe(50); // 2h x $25
    expect(report.earned).toBe(50);
    expect(report.jobs[0].earned).toBe(50);
  });

  it('excludes pending and running time, as the hour totals do', () => {
    const pending = build([session({status: 'needsReview'})]);
    expect(pending.earned).toBe(0);
    expect(pending.pendingMs).toBeGreaterThan(0);

    const running = build([
      session({status: 'active', endedAt: null, autoStopAt: NOW + HOUR}),
    ]);
    expect(running.earned).toBe(0);
    expect(running.runningMs).toBeGreaterThan(0);
  });

  it('counts unrated time as hours, never as $0', () => {
    const report = build([
      session({paySnapshot: {basis: 'hourly', hourlyRate: null, rateSource: 'unavailable'}}),
    ]);
    expect(report.earned).toBe(0);
    expect(report.unratedMs).toBe(2 * HOUR);
    expect(report.jobs[0].unratedMs).toBe(2 * HOUR);
  });

  it('keeps legacy general work without an explicit total out of earned', () => {
    const report = build([
      session({
        jobId: null,
        jobSnapshot: null,
        paySnapshot: {basis: 'general', hourlyRate: 20, rateSource: 'cleanerDefault'},
      }),
    ]);
    expect(report.earnedGeneral).toBe(40);
    expect(report.earned).toBe(0);
  });

  it('does not accrue per session for a flat job', () => {
    // The job price is job-level; dividing it across sessions is the thing the
    // whole design forbids.
    const report = build([
      session({paySnapshot: {basis: 'flat', hourlyRate: null, rateSource: 'unavailable'}}),
    ]);
    expect(report.earned).toBe(0);
    expect(report.unratedMs).toBe(0);
  });
});

describe('fixed-price ledger', () => {
  it('adds a completed job once', () => {
    const report = build([], [ledger()]);
    expect(report.earnedJobs).toBe(50);
    expect(report.earned).toBe(50);
  });

  it('counts a duplicated row only once', () => {
    const report = build([], [ledger(), ledger()]);
    expect(report.earnedJobs).toBe(50);
  });

  it('ignores rows outside the month, which the padded query returns', () => {
    // workMonthQueryRange pads a day each side so no row is missed at a
    // boundary; without the month test a job would count in two months.
    const report = build([], [ledger({completedAt: Date.UTC(2026, 8, 30, 12)})]);
    expect(report.earnedJobs).toBe(0);
  });

  it('combines with hourly accrual from a different job', () => {
    const report = build([session()], [ledger()]);
    expect(report.earned).toBe(100);
  });
});

describe('awaiting payment', () => {
  it('is measured per job, where earned and collected mean the same work', () => {
    const paid = {
      id: 'inv', invoiceId: 'INV-1', cleanerId: 'cleaner-1', jobId: 'job-1',
      price: '$20', jobPostName: 'House', paymentStatus: 'paid',
      paidAt: new Date(2026, 9, 10),
    } as any;
    const report = build([session()], [], [paid]);
    expect(report.jobs[0].earned).toBe(50);
    expect(report.jobs[0].collected).toBe(20);
    expect(report.awaitingPayment).toBe(30);
  });

  it('does not let an overpaid job net off another job shortfall', () => {
    const over = {
      id: 'inv', invoiceId: 'INV-2', cleanerId: 'cleaner-1', jobId: 'job-flat',
      price: '$500', jobPostName: 'Flat', paymentStatus: 'paid',
      paidAt: new Date(2026, 9, 10),
    } as any;
    const report = build([session()], [ledger()], [over]);
    // job-1 is short $50; job-flat is paid far above its $50 accrual.
    expect(report.awaitingPayment).toBe(50);
  });
});

describe('explicit total earnings for general work', () => {
  const general = (over: any = {}) => session({jobId: null, jobSnapshot: null, expectedEarnings: 125.50,
    paySnapshot: {basis: 'general', hourlyRate: 20, rateSource: 'cleanerDefault'}, ...over});
  it('counts the total once without multiplying hours or adding the default rate', () => {
    const report = build([general(), general(), session({id: 'hourly-record'})], [ledger()]);
    expect(report.earnedGeneralReported).toBe(125.50);
    expect(report.earnedGeneral).toBe(0);
    expect(report.earned).toBe(225.50);
    expect(report.jobs.find(job => job.key === 'general')?.earned).toBe(125.50);
    expect(build([general({expectedEarnings: 0})]).unratedMs).toBe(0);
    expect(build([general({expectedEarnings: 140})]).earned).toBe(140);
  });
  it.each(['active', 'needsReview', 'discarded'])('excludes %s amounts', status => {
    expect(build([general({status})]).earned).toBe(0);
  });
  it('counts a cross-month total in the finish month, using the saved zone and exact midnight boundary', () => {
    const work = general({startedAt: Date.UTC(2026, 9, 31, 22), endedAt: Date.UTC(2026, 10, 1, 2)});
    const report = (month: number, record = work) => buildWorkMonthlyReport([record], [],
      {year: 2026, month}, Date.UTC(2026, 10, 2));
    expect(report(9).earned).toBe(0);
    expect(report(10).earned).toBe(125.50);
    expect(report(9).confirmedMs).toBe(2 * HOUR);
    expect(report(10).confirmedMs).toBe(2 * HOUR);
    expect(report(9, {...work, endedAt: Date.UTC(2026, 10, 1)}).earned).toBe(125.50);
    expect(report(10, {...work, endedAt: Date.UTC(2026, 10, 1)}).earned).toBe(0);
    expect(report(9, {...work, reportingTimeZone: 'America/New_York'}).earned).toBe(125.50);
    expect(report(10, {...work, reportingTimeZone: 'America/New_York'}).earned).toBe(0);
  });
});
