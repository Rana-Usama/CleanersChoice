import {Platform} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  JobReport,
  REPORT_DETAILS_MAX,
  ReportReason,
  ReportStatus,
} from '../types/report';

/**
 * Data layer for job/customer reports.
 *
 * Document id is `${reporterUid}_${jobId}`: one report per cleaner per job,
 * enforced by firestore.rules (create-only for non-admins), and lets the app
 * check "already reported" with a single `get()` the rules can authorise
 * even when the document doesn't exist yet.
 */

const COLLECTION = 'Reports';

export const reportDocId = (reporterId: string, jobId: string) =>
  `${reporterId}_${jobId}`;

export class AlreadyReportedError extends Error {
  constructor() {
    super('You have already reported this job.');
    this.name = 'AlreadyReportedError';
  }
}

export const hasReportedJob = async (jobId: string): Promise<boolean> => {
  const user = auth().currentUser;
  if (!user || !jobId) return false;
  const snap = await firestore()
    .collection(COLLECTION)
    .doc(reportDocId(user.uid, jobId))
    .get();
  return snap.exists;
};

interface SubmitJobReportInput {
  jobId: string;
  jobTitle?: string | null;
  reportedUserId?: string | null;
  reportedUserName?: string | null;
  reporterName?: string | null;
  reporterRole?: string | null;
  reason: ReportReason;
  details?: string;
}

export const submitJobReport = async (
  input: SubmitJobReportInput,
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  if (!input.jobId) throw new Error('This job can no longer be reported.');

  const details = (input.details ?? '').trim().slice(0, REPORT_DETAILS_MAX);
  if (input.reason === 'other' && !details) {
    throw new Error('Please describe the problem.');
  }

  const ref = firestore()
    .collection(COLLECTION)
    .doc(reportDocId(user.uid, input.jobId));

  const existing = await ref.get();
  if (existing.exists) throw new AlreadyReportedError();

  await ref.set({
    reporterId: user.uid,
    reporterName: input.reporterName ?? null,
    reporterEmail: user.email ?? null,
    reporterRole: input.reporterRole ?? null,
    jobId: input.jobId,
    jobTitle: input.jobTitle ?? null,
    reportedUserId: input.reportedUserId ?? null,
    reportedUserName: input.reportedUserName ?? null,
    reason: input.reason,
    details,
    status: 'open' as ReportStatus,
    platform: Platform.OS,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
};

/** All reports, newest first. Sorted client-side to avoid a composite index. */
export const fetchReports = async (): Promise<JobReport[]> => {
  const snapshot = await firestore().collection(COLLECTION).get();
  return snapshot.docs
    .map(doc => ({id: doc.id, ...(doc.data() as object)}) as JobReport)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
};

export const countOpenReports = async (): Promise<number> => {
  try {
    const snap = await firestore()
      .collection(COLLECTION)
      .where('status', '==', 'open')
      .count()
      .get();
    return snap.data().count;
  } catch (error) {
    console.log('[reportService] open count failed:', error);
    return 0;
  }
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  await firestore()
    .collection(COLLECTION)
    .doc(reportId)
    .update({
      status,
      reviewedAt: firestore.FieldValue.serverTimestamp(),
      reviewedBy: user.uid,
    });
};

/** Loads the reported job so the admin can open it in JobDetails. */
export const fetchReportedJob = async (jobId: string): Promise<any | null> => {
  const snap = await firestore().collection('Jobs').doc(jobId).get();
  return snap.exists ? {id: snap.id, ...(snap.data() as object)} : null;
};
