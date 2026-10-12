import {
  parseJobMoney,
  resolveJobEarning,
} from '../functions/src/workSessions/jobEarnings';
import {parseMoney, parseQuantity, roundMoney} from '../src/utils/money';

const NOW = Date.UTC(2026, 9, 20, 12);
const completedJob = (over: Record<string, unknown> = {}) => ({
  status: 'completed',
  budgetType: 'flat',
  confirmedCleaner: 'cleaner-1',
  priceRange: '50',
  ...over,
});

describe('money parsing keeps cents', () => {
  it('does not strip the decimal point the way the old parser did', () => {
    // The shipped parser was parseInt(v.replace(/[^0-9]/g,'')), so "$50.50"
    // became 5050 and "$22.50/hr" became 2250 - and that ran on the WRITE
    // path, so the corrupted value was stored.
    expect(parseMoney('$50.50')).toBe(50.5);
    expect(parseMoney('$22.50')).toBe(22.5);
    expect(parseJobMoney('$50.50')).toBe(50.5);
    expect(parseMoney('1,250.75')).toBe(1250.75);
  });
  it('rejects unusable input rather than inventing a number', () => {
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('Custom')).toBe(0);
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney(-5)).toBe(0);
    expect(parseJobMoney(undefined)).toBe(0);
  });
  it('tolerates a second separator instead of producing NaN', () => {
    expect(parseMoney('50.5.5')).toBe(50.55);
  });
  it('keeps fractional quantities, which parseInt silently truncated', () => {
    // The form's own validation message says "e.g. 2.5".
    expect(parseQuantity('2.5')).toBe(2.5);
  });
  it('rounds without float drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('resolveJobEarning recognises fixed-price work once', () => {
  it('recognises a completed flat job', () => {
    expect(resolveJobEarning('job-1', completedJob(), NOW)).toEqual({
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      basis: 'flat',
      amount: 50,
      completedAt: NOW,
      source: 'jobCompletion',
    });
  });
  it('recognises sqft the same way - it is a computed total', () => {
    const earning = resolveJobEarning(
      'job-1',
      completedJob({budgetType: 'sqft', priceRange: '275.25'}),
      NOW,
    );
    expect(earning?.basis).toBe('sqft');
    expect(earning?.amount).toBe(275.25);
  });
  it('never recognises hourly work, which accrues per session', () => {
    // Writing it here too would double-count against the session accrual.
    expect(
      resolveJobEarning('job-1', completedJob({budgetType: 'hourly'}), NOW),
    ).toBeNull();
  });
  it('treats a missing budgetType as flat, exactly as the pay snapshot does', () => {
    /*
      operations.ts resolves an absent budgetType to "flat". When this returned
      null instead, a legacy job was snapshotted as flat (so no per-session
      accrual, because flat money is job-level) and then skipped on completion:
      hours recorded, money silently zero, forever.
    */
    const earning = resolveJobEarning(
      'job-1',
      completedJob({budgetType: undefined}),
      NOW,
    );
    expect(earning?.basis).toBe('flat');
    expect(earning?.amount).toBe(50);
  });
  it('ignores a job that has not completed', () => {
    expect(
      resolveJobEarning('job-1', completedJob({status: 'confirmed'}), NOW),
    ).toBeNull();
    expect(
      resolveJobEarning(
        'job-1',
        completedJob({status: 'pending_completion'}),
        NOW,
      ),
    ).toBeNull();
    expect(resolveJobEarning('job-1', undefined, NOW)).toBeNull();
  });
  it('ignores a completed job with no cleaner to credit', () => {
    expect(
      resolveJobEarning('job-1', completedJob({confirmedCleaner: ''}), NOW),
    ).toBeNull();
  });
  it('ignores a job with no usable price rather than booking $0', () => {
    expect(
      resolveJobEarning('job-1', completedJob({priceRange: ''}), NOW),
    ).toBeNull();
  });
  it('rejects an implausible amount instead of storing it as money', () => {
    expect(
      resolveJobEarning('job-1', completedJob({priceRange: '99999999'}), NOW),
    ).toBeNull();
  });
});
