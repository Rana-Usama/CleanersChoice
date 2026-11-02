/**
 * `Reports/{reporterUid}_{jobId}` — a cleaner flagging a job or the customer
 * who posted it. Written by the app (reportService.submitJobReport), reviewed
 * by admins on AdminReports.
 */

export type ReportReason = 'phone_not_working' | 'suspected_fake' | 'other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export const REPORT_REASONS: {key: ReportReason; label: string}[] = [
  {key: 'phone_not_working', label: 'Phone number not working'},
  {key: 'suspected_fake', label: 'Suspected fake job or customer'},
  {key: 'other', label: 'Other'},
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  phone_not_working: 'Phone number not working',
  suspected_fake: 'Suspected fake job or customer',
  other: 'Other',
};

/** Free-text cap, enforced in the sheet and in firestore.rules. */
export const REPORT_DETAILS_MAX = 500;

export interface JobReport {
  id: string;
  reporterId: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterRole?: string | null;
  jobId: string;
  jobTitle?: string | null;
  /** The posting customer's uid (`Jobs.jobId`). */
  reportedUserId?: string | null;
  reportedUserName?: string | null;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  platform?: string;
  createdAt?: any;
  reviewedAt?: any;
  reviewedBy?: string | null;
}
