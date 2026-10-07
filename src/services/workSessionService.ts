import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import type {
  WorkSession,
  WorkSessionRequest,
  WorkSessionResult,
  WorkSessionAudit,
} from '../types/workSession';

export class WorkSessionServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'WorkSessionServiceError';
  }
}

const requireUser = () => {
  const user = auth().currentUser;
  if (!user) {
    throw new WorkSessionServiceError(
      'unauthenticated',
      'Please sign in again.',
    );
  }
  return user;
};

/** Keep this ID with the pending action and reuse it after a network failure. */
export const createWorkSessionRequestId = (): string =>
  firestore().collection('WorkSessions').doc().id;

export const operateWorkSession = async (
  request: WorkSessionRequest,
): Promise<WorkSessionResult> => {
  const user = requireUser();
  const projectId = firebase.app().options.projectId;
  if (!projectId) {
    throw new WorkSessionServiceError(
      'unavailable',
      'Work tracking is not configured.',
    );
  }
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      `https://us-central1-${projectId}.cloudfunctions.net/workSessionOperation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      },
    );
    const body = await response.json();
    if (!response.ok) {
      throw new WorkSessionServiceError(
        body.error?.code || 'unavailable',
        body.error?.message ||
          'Could not save this work record. Retry the same request.',
      );
    }
    if (
      !body.result?.sessionId ||
      !['active', 'needsReview', 'confirmed', 'discarded'].includes(
        body.result.status,
      )
    ) {
      throw new WorkSessionServiceError(
        'unavailable',
        'Unexpected server response. Retry the same request.',
      );
    }
    // Never report a late clock-out as confirmed: the server may return needsReview.
    return body.result as WorkSessionResult;
  } catch (error) {
    if (error instanceof WorkSessionServiceError) {
      throw error;
    }
    throw new WorkSessionServiceError(
      'unavailable',
      'Could not confirm the save. Reconnect and retry using the same request ID.',
    );
  } finally {
    clearTimeout(timeout);
  }
};

type NewWorkRequest = {
  requestId: string;
  reportingTimeZone: string;
  jobId?: string | null;
  note?: string;
};
type TimesRequest = {
  requestId: string;
  sessionId: string;
  startedAt: number;
  endedAt: number;
  note?: string;
};

export const clockIn = (input: NewWorkRequest & {plannedFinishAt?: number}) =>
  operateWorkSession({...input, action: 'clockIn'});
export const clockOut = (input: {
  requestId: string;
  sessionId: string;
  note?: string;
}) => operateWorkSession({...input, action: 'clockOut'});
/** For app resume/deadline checks; this can stop to review but never confirms hours. */
export const reconcileWorkSession = (input: {
  requestId: string;
  sessionId: string;
}) => operateWorkSession({...input, action: 'reconcile'});
export const requestWorkSessionReview = (input: {
  requestId: string;
  sessionId: string;
}) => operateWorkSession({...input, action: 'requestReview'});
export const addManualWorkSession = (
  input: NewWorkRequest & {startedAt: number; endedAt: number},
) => operateWorkSession({...input, action: 'addManual'});
export const confirmWorkSession = (input: TimesRequest) =>
  operateWorkSession({...input, action: 'confirm'});
export const editWorkSession = (input: TimesRequest) =>
  operateWorkSession({...input, action: 'edit'});
export const discardWorkSession = (input: {
  requestId: string;
  sessionId: string;
  note?: string;
}) => operateWorkSession({...input, action: 'discard'});

export const subscribeOpenWorkSessions = (
  onChange: (sessions: WorkSession[]) => void,
  onError: (error: Error) => void,
): (() => void) =>
  firestore()
    .collection('WorkSessions')
    .where('cleanerId', '==', requireUser().uid)
    .where('status', 'in', ['active', 'needsReview'])
    .orderBy('startedAt', 'asc')
    .onSnapshot(
      snapshot =>
        onChange(
          snapshot.docs.map(
            doc => ({...doc.data(), id: doc.id} as WorkSession),
          ),
        ),
      onError,
    );

export const getOpenWorkSessions = async (): Promise<WorkSession[]> => {
  const snapshot = await firestore()
    .collection('WorkSessions')
    .where('cleanerId', '==', requireUser().uid)
    .where('status', 'in', ['active', 'needsReview'])
    .orderBy('startedAt', 'asc')
    .get({source: 'server'});
  return snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as WorkSession));
};

export const hasWorkSessionHistory = async (): Promise<boolean> => {
  const snapshot = await firestore()
    .collection('WorkSessions')
    .where('cleanerId', '==', requireUser().uid)
    .limit(1)
    .get({source: 'server'});
  return !snapshot.empty;
};

export const getWorkSession = async (
  sessionId: string,
): Promise<WorkSession | null> => {
  requireUser();
  const snapshot = await firestore()
    .collection('WorkSessions')
    .doc(sessionId)
    .get({source: 'server'});
  return snapshot.exists
    ? ({...snapshot.data(), id: snapshot.id} as WorkSession)
    : null;
};

/** Include up to 12h before the range to retain sessions crossing month boundaries. */
export const subscribeWorkSessions = (
  range: {from: number; to: number},
  onChange: (sessions: WorkSession[]) => void,
  onError: (error: Error) => void,
  onCacheChange?: (cached: boolean) => void,
): (() => void) => {
  const uid = requireUser().uid;
  return firestore()
    .collection('WorkSessions')
    .where('cleanerId', '==', uid)
    .where('startedAt', '>=', Math.max(0, range.from - 12 * 3600000))
    .where('startedAt', '<', range.to)
    .orderBy('startedAt', 'desc')
    .onSnapshot(
      {includeMetadataChanges: true},
      snapshot => {
        onCacheChange?.(snapshot.metadata.fromCache);
        onChange(
          snapshot.docs.map(
            doc => ({...doc.data(), id: doc.id} as WorkSession),
          ),
        );
      },
      onError,
    );
};

/** The lock points to either active work or an auto-stopped session awaiting review. */
export const subscribeCurrentWorkSession = (
  onChange: (session: WorkSession | null) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const uid = requireUser().uid;
  let sessionId: string | null = null;
  let unsubscribeSession: (() => void) | undefined;
  const unsubscribeLock = firestore()
    .collection('WorkSessionLocks')
    .doc(uid)
    .onSnapshot(snapshot => {
      const nextId =
        snapshot.data()?.activeSessionId ||
        snapshot.data()?.reviewSessionIds?.[0] ||
        null;
      if (nextId === sessionId && nextId !== null) {
        return;
      }
      unsubscribeSession?.();
      sessionId = nextId;
      if (!nextId) {
        onChange(null);
        return;
      }
      unsubscribeSession = firestore()
        .collection('WorkSessions')
        .doc(nextId)
        .onSnapshot(session => {
          onChange(
            session.exists
              ? ({...session.data(), id: session.id} as WorkSession)
              : null,
          );
        }, onError);
    }, onError);
  return () => {
    unsubscribeLock();
    unsubscribeSession?.();
  };
};

export const getWorkSessionHistory = async (
  sessionId: string,
): Promise<WorkSessionAudit[]> => {
  requireUser();
  const snapshot = await firestore()
    .collection('WorkSessions')
    .doc(sessionId)
    .collection('history')
    .orderBy('at', 'desc')
    .get({source: 'server'});
  return snapshot.docs.map(doc => doc.data() as WorkSessionAudit);
};

export const subscribeWorkSession = (
  sessionId: string,
  onChange: (session: WorkSession | null) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const uid = requireUser().uid;
  return firestore()
    .collection('WorkSessions')
    .doc(sessionId)
    .onSnapshot(snapshot => {
      if (auth().currentUser?.uid !== uid) {
        return;
      }
      const session = snapshot.exists
        ? ({...snapshot.data(), id: snapshot.id} as WorkSession)
        : null;
      onChange(session?.cleanerId === uid ? session : null);
    }, onError);
};

export type WorkHistoryEvent = WorkSessionAudit & {id: string};
export const getWorkSessionHistoryPage = async (
  sessionId: string,
  cursor?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
) => {
  requireUser();
  let query = firestore()
    .collection('WorkSessions')
    .doc(sessionId)
    .collection('history')
    .orderBy('at', 'desc')
    .limit(25);
  if (cursor) {
    query = query.startAfter(cursor);
  }
  const snapshot = await query.get({source: 'server'});
  return {
    events: snapshot.docs.map(
      doc => ({...doc.data(), id: doc.id} as WorkHistoryEvent),
    ),
    cursor: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.size === 25,
  };
};

export const getOriginalWorkSessionEvent = async (
  sessionId: string,
): Promise<WorkSessionAudit | null> => {
  requireUser();
  const snapshot = await firestore()
    .collection('WorkSessions')
    .doc(sessionId)
    .collection('history')
    .where('action', 'in', ['clockIn', 'addManual'])
    .limit(1)
    .get({source: 'server'});
  return snapshot.empty ? null : (snapshot.docs[0].data() as WorkSessionAudit);
};

export type ManualWorkJob = {
  id: string;
  title: string;
  budgetType?: string;
  hourlyRate?: number | string;
};
export const getManualWorkJobs = async (
  cursor?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
) => {
  let query = firestore()
    .collection('Jobs')
    .where('confirmedCleaner', '==', requireUser().uid)
    .limit(25);
  if (cursor) {
    query = query.startAfter(cursor);
  }
  const snapshot = await query.get({source: 'server'});
  return {
    jobs: snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          title: String(doc.data().title || 'Job'),
          budgetType: doc.data().budgetType,
          hourlyRate: doc.data().hourlyRate,
        } as ManualWorkJob),
    ),
    cursor: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.size === 25,
  };
};
