/**
 * A fixed-price job's earnings, recognised once when the job completes.
 *
 * Written only by the server (the Jobs trigger); the client reads its own rows.
 * Hourly and general work never appear here - that money accrues per session
 * from `paySnapshot.hourlyRate`, and duplicating it would double-count.
 */
export interface JobEarning {
  jobId: string;
  cleanerId: string;
  basis: 'flat' | 'sqft';
  amount: number;
  completedAt: number;
  source: 'jobCompletion';
  revision: number;
  updatedAt: number;
}
