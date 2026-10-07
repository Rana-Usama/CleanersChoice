import {
  buildWorkMonthlyReport,
  workCurrency,
} from '../src/services/workMonthlyReport';
import {buildAnnualEarningsSummary} from '../src/services/earningsService';
import {
  workMonthBounds,
  workMonthQueryRange,
  workTimeInMonth,
  shiftWorkMonth,
} from '../src/utils/workMonth';
import type {WorkSession} from '../src/types/workSession';
import type {Invoice} from '../src/types/invoice';
const HOUR = 3600000;
const OCT = {year: 2026, month: 9};
const NOW = Date.UTC(2026, 9, 20, 12);
const session = (
  id: string,
  hours: number,
  extra: Partial<WorkSession> = {},
): WorkSession => ({
  id,
  cleanerId: 'cleaner',
  jobId: null,
  jobSnapshot: null,
  source: 'clock',
  status: 'confirmed',
  startedAt: NOW - hours * HOUR,
  endedAt: NOW,
  autoStopAt: NOW + HOUR,
  durationMs: hours * HOUR,
  estimatedDurationMs: 0,
  reportingTimeZone: 'UTC',
  paySnapshot: {
    basis: 'general',
    hourlyRate: 25,
    rateSource: 'cleanerDefault',
    capturedAt: NOW,
  },
  expectedEndAt: null,
  timingConfig: {
    enabled: true,
    graceHours: 3,
    hardCapHours: 12,
    manualEntryMaxAgeDays: 7,
  },
  stopReason: null,
  note: '',
  editHistory: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...extra,
});
const invoice = (
  id: string,
  jobId: string,
  price: string,
  extra: Partial<Invoice> = {},
): Invoice =>
  ({
    id,
    invoiceId: id,
    jobId,
    cleanerId: 'cleaner',
    customerId: 'customer',
    jobPostName: jobId,
    paymentStatus: 'paid',
    paidAt: new Date(2026, 9, 15, 12),
    price,
    toName: 'Customer',
    ...extra,
  } as Invoice);
const linked = (id: string, hours: number, jobId: string) =>
  session(id, hours, {
    jobId,
    jobSnapshot: {
      title: jobId,
      customerId: 'customer',
      scheduledStartAt: null,
      expectedHours: null,
      scheduleTimeZone: null,
    },
  });

it('reconciles the agreed example without counting pending estimates or splitting a fixed invoice', () => {
  const sessions = [
    linked('john', 2.5, 'John'),
    linked('mike', 5, 'Mike'),
    ...[10, 10, 10, 5].map((hours, index) =>
      linked(`sandra${index}`, hours, 'Sandra'),
    ),
    session('pending1', 6, {status: 'needsReview', durationMs: 0}),
    session('pending2', 3, {status: 'needsReview', durationMs: 0}),
  ];
  const invoices = [
    invoice('johnInvoice', 'John', '$50'),
    invoice('mikeInvoice', 'Mike', '$20'),
    invoice('sandraInvoice', 'Sandra', '$875'),
  ];
  const report = buildWorkMonthlyReport(sessions, invoices, OCT, NOW);
  expect(report.confirmedMs).toBe(42.5 * HOUR);
  expect(report.pendingMs).toBe(9 * HOUR);
  expect(report.pendingCount).toBe(2);
  expect(report.collected).toBe(945);
  expect(workCurrency(report.effectiveRate!)).toBe('$22.24');
  expect(report.jobs.reduce((sum, job) => sum + job.collected, 0)).toBe(945);
  expect(report.jobs.reduce((sum, job) => sum + job.confirmedMs, 0)).toBe(
    report.confirmedMs,
  );
  expect(report.jobs.find(job => job.jobId === 'Sandra')).toMatchObject({
    confirmedMs: 35 * HOUR,
    collected: 875,
    paidInvoiceCount: 1,
  });
  const running = buildWorkMonthlyReport(
    [
      ...sessions,
      session('running', 2 + 14 / 60, {status: 'active', endedAt: null}),
    ],
    invoices,
    OCT,
    NOW,
  );
  expect(running.includingRunningMs).toBe((44 * 60 + 44) * 60000);
  expect(workCurrency(running.provisionalRate!)).toBe('$21.13');
  expect(running.confirmedMs).toBe(report.confirmedMs);
  expect(running.collected).toBe(report.collected);
});

it.each(['confirmed', 'needsReview', 'active'] as const)(
  'splits an overnight %s record at its saved local month boundary',
  status => {
    // October 31 23:00 to November 1 01:00 in New York (EDT).
    const start = Date.UTC(2026, 10, 1, 3),
      end = start + 2 * HOUR;
    const saved = session('overnight', 2, {
      status,
      startedAt: start,
      endedAt: status === 'active' ? null : end,
      autoStopAt: end + HOUR,
      reportingTimeZone: 'America/New_York',
    });
    const key =
      status === 'confirmed'
        ? 'confirmedMs'
        : status === 'active'
        ? 'runningMs'
        : 'pendingMs';
    const oct = buildWorkMonthlyReport([saved], [], OCT, end);
    const nov = buildWorkMonthlyReport(
      [saved],
      [],
      {year: 2026, month: 10},
      end,
    );
    expect(oct[key]).toBe(HOUR);
    expect(nov[key]).toBe(HOUR);
    expect(oct.records[0].crossesMonth).toBe(true);
  },
);

it('uses elapsed instants through daylight-saving jumps and leap-month/year boundaries', () => {
  const springStart = Date.UTC(2026, 2, 8, 6),
    springEnd = Date.UTC(2026, 2, 8, 8);
  expect(
    workTimeInMonth(
      springStart,
      springEnd,
      {year: 2026, month: 2},
      'America/New_York',
    ),
  ).toBe(2 * HOUR);
  const fallStart = Date.UTC(2026, 10, 1, 4),
    fallEnd = Date.UTC(2026, 10, 1, 8);
  expect(
    workTimeInMonth(
      fallStart,
      fallEnd,
      {year: 2026, month: 10},
      'America/New_York',
    ),
  ).toBe(4 * HOUR);
  const feb = workMonthBounds({year: 2024, month: 1}, 'UTC');
  expect(feb.to - feb.from).toBe(29 * 24 * HOUR);
  expect(shiftWorkMonth({year: 2026, month: 11}, 1)).toEqual({
    year: 2027,
    month: 0,
  });
  expect(shiftWorkMonth({year: 2026, month: 0}, -1)).toEqual({
    year: 2025,
    month: 11,
  });
  expect(
    workTimeInMonth(
      Date.UTC(2026, 11, 31, 23),
      Date.UTC(2027, 0, 1, 1),
      {year: 2026, month: 11},
      'UTC',
    ),
  ).toBe(HOUR);
});

it.each([
  'Pacific/Kiritimati',
  'Pacific/Pago_Pago',
  'Asia/Kathmandu',
  'America/New_York',
  'UTC',
])('keeps cross-boundary records in the query envelope for %s', zone => {
  const bounds = workMonthBounds(OCT, zone),
    query = workMonthQueryRange(OCT);
  expect(bounds.from - 12 * HOUR).toBeGreaterThanOrEqual(
    query.from - 12 * HOUR,
  );
  expect(bounds.to).toBeLessThan(query.to);
  expect(
    workTimeInMonth(bounds.from - HOUR, bounds.from + HOUR, OCT, zone),
  ).toBe(HOUR);
  expect(workTimeInMonth(bounds.to - HOUR, bounds.to + HOUR, OCT, zone)).toBe(
    HOUR,
  );
});

it('recognizes cash in the paid month and reconciles to the existing earnings service', () => {
  const saved = linked('work', 2, 'job');
  const later = invoice('paidLater', 'job', '$120.50', {
    paidAt: {toDate: () => new Date(2026, 10, 5, 12)},
  });
  const unpaid = invoice('unpaid', 'job', '$500', {
    paymentStatus: 'unpaid',
    paidAt: null,
  });
  const legacy = invoice('legacy', 'other', '$20.25', {
    paidAt: new Date(2026, 9, 10, 12).toISOString(),
  });
  const noDate = invoice('missingPaidDate', 'third', '$900', {paidAt: null});
  const invoices = [later, unpaid, legacy, noDate];
  const october = buildWorkMonthlyReport([saved], invoices, OCT, NOW);
  expect(october.collected).toBe(
    buildAnnualEarningsSummary(invoices, 2026).monthly[9].total,
  );
  expect(october.collected).toBe(20.25);
  expect(october.paidInvoices).toHaveLength(1);
  const november = buildWorkMonthlyReport(
    [saved],
    invoices,
    {year: 2026, month: 10},
    NOW,
  );
  expect(november.collected).toBe(120.5);
  expect(november.confirmedMs).toBe(0);
  expect(november.effectiveRate).toBeNull();
  expect(october.outstandingTotal).toBe(500);
});

it('keeps money-only jobs and unlinked invoices separate from General work, with every row reconciling', () => {
  const report = buildWorkMonthlyReport(
    [session('general', 2)],
    [invoice('cashOnly', 'oldJob', '$50'), invoice('unlinked', '', '$10')],
    OCT,
    NOW,
  );
  expect(report.jobs.find(job => job.key === 'general')).toMatchObject({
    confirmedMs: 2 * HOUR,
    collected: 0,
  });
  expect(report.jobs.find(job => job.jobId === 'oldJob')).toMatchObject({
    confirmedMs: 0,
    collected: 50,
  });
  expect(report.jobs.find(job => job.key === 'unlinkedInvoices')).toMatchObject(
    {confirmedMs: 0, collected: 10},
  );
  expect(report.jobsWithoutInvoice).toHaveLength(0);
  expect(report.jobs.reduce((sum, job) => sum + job.collected, 0)).toBe(
    report.collected,
  );
});

it('avoids double-counting outstanding and no-invoice work, including invoices from another month', () => {
  const work = [
    linked('unbilled', 2, 'noInvoice'),
    linked('billed', 2, 'unpaidJob'),
    linked('paidEarlier', 2, 'paidJob'),
    session('general', 2),
  ];
  const invoices = [
    invoice('unpaid', 'unpaidJob', '$100', {paymentStatus: 'unpaid'}),
    invoice('earlier', 'paidJob', '$100', {paidAt: new Date(2026, 8, 1)}),
  ];
  const report = buildWorkMonthlyReport(work, invoices, OCT, NOW);
  expect(report.jobsWithoutInvoice.map(job => job.jobId)).toEqual([
    'noInvoice',
  ]);
  expect(report.outstandingTotal).toBe(100);
  expect(report.collected).toBe(0);
  expect(report.effectiveRate).toBe(0);
});

it('updates confirmed hours after review/correction and removes discarded hours without changing invoice money', () => {
  const pending = session('work', 2, {status: 'needsReview'}),
    invoiceData = [invoice('paid', 'job', '$50')];
  expect(
    buildWorkMonthlyReport([pending], invoiceData, OCT, NOW).confirmedMs,
  ).toBe(0);
  const confirmed = {...pending, status: 'confirmed' as const};
  expect(
    buildWorkMonthlyReport([confirmed, confirmed], invoiceData, OCT, NOW)
      .confirmedMs,
  ).toBe(2 * HOUR);
  expect(
    buildWorkMonthlyReport(
      [{...confirmed, startedAt: NOW - HOUR}],
      invoiceData,
      OCT,
      NOW,
    ).confirmedMs,
  ).toBe(HOUR);
  const discarded = buildWorkMonthlyReport(
    [{...confirmed, status: 'discarded'}],
    invoiceData,
    OCT,
    NOW,
  );
  expect(discarded.confirmedMs).toBe(0);
  expect(discarded.records).toHaveLength(0);
  expect(discarded.collected).toBe(50);
});

it('removes running previews at the saved cutoff, even before a delayed server sweep arrives', () => {
  const active = session('active', 13, {
    status: 'active',
    endedAt: null,
    autoStopAt: NOW - HOUR,
  });
  const report = buildWorkMonthlyReport([active], [], OCT, NOW);
  expect(report.runningMs).toBe(0);
  expect(report.provisionalRate).toBeNull();
  expect(report.overdue).toBe(true);
  expect(report.pendingMs).toBe(12 * HOUR);
  expect(report.confirmedMs).toBe(0);
});

it('counts no empty or unavailable rate as infinity and reports an invalid saved timezone', () => {
  const empty = buildWorkMonthlyReport([], [], OCT, NOW);
  expect(empty.effectiveRate).toBeNull();
  expect(empty.provisionalRate).toBeNull();
  const bad = buildWorkMonthlyReport(
    [session('bad', 2, {reportingTimeZone: 'unknown/zone'})],
    [],
    OCT,
    NOW,
  );
  expect(bad.confirmedMs).toBe(0);
  expect(bad.invalidRecordCount).toBe(1);
});
