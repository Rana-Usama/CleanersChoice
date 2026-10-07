import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Alert, AppState} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  WorkSession,
  WorkSessionConfig,
  WorkSessionRequest,
  WorkSessionResult,
} from '../../types/workSession';
import {getWorkSessionConfig} from '../../services/workSessionConfigService';
import {
  createWorkSessionRequestId,
  getOpenWorkSessions,
  getWorkSession,
  hasWorkSessionHistory,
  operateWorkSession,
  subscribeOpenWorkSessions,
} from '../../services/workSessionService';
import {WorkSessionQueue} from '../../services/workSessionQueue';
import {syncWorkReminder} from '../../services/workSessionReminders';
import {
  canStartWork,
  canUseWorkRecords,
  deviceWorkTimeZone,
  workSessionPhase,
} from '../../utils/workSessionFlow';
import {WorkSessionDialog, WorkDialogState} from './WorkSessionDialog';
import {DEFAULT_WORK_SESSION_CONFIG} from '../../utils/workSessionConfig';
import {manualWorkAvailable} from '../../utils/workSessionEntry';

type Draft = Omit<WorkSessionRequest, 'requestId'>;
type Context = {
  user: Record<string, any> | null;
  uid: string | null;
  enabled: boolean;
  config: WorkSessionConfig;
  manualAvailable: boolean;
  ready: boolean;
  current: WorkSession | null;
  reviews: WorkSession[];
  hasHistory: boolean;
  busy: boolean;
  pending: boolean;
  pendingRequest: WorkSessionRequest | null;
  error: string;
  reminderUnavailable: boolean;
  now: number;
  start(jobId?: string): Promise<void>;
  stop(session?: WorkSession): Promise<boolean>;
  review(session: WorkSession): Promise<boolean>;
  edit(session: WorkSession): Promise<boolean>;
  saveManual(input: {
    startedAt: number;
    endedAt: number;
    reportingTimeZone: string;
    jobId?: string | null;
    note?: string;
  }): Promise<WorkSessionResult>;
  retry(): Promise<WorkSessionResult | null>;
  refresh(): Promise<void>;
  planFinish(): void;
  beforeJobAction(
    jobId: string,
    action: 'complete' | 'cancel',
  ): Promise<boolean>;
};
const WorkContext = createContext<Context | null>(null);
export const useWorkSessions = () => {
  const context = useContext(WorkContext);
  if (!context) {
    throw new Error('WorkSessionProvider is missing.');
  }
  return context;
};

const confirm = (
  title: string,
  message: string,
  button: string,
): Promise<boolean> =>
  new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        {text: 'Not now', style: 'cancel', onPress: () => resolve(false)},
        {text: button, onPress: () => resolve(true)},
      ],
      {cancelable: true, onDismiss: () => resolve(false)},
    );
  });

export const WorkSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [config, setConfig] = useState<WorkSessionConfig | null>(null);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [ready, setReady] = useState(false);
  const [readRevision, setReadRevision] = useState(0);
  const [hasHistory, setHasHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingRequest, setPendingRequest] =
    useState<WorkSessionRequest | null>(null);
  const [error, setError] = useState('');
  const [reminderUnavailable, setReminderUnavailable] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [dialog, setDialog] = useState<WorkDialogState | null>(null);
  const queue = useRef<WorkSessionQueue | null>(null);
  const owner = useRef<string | null>(null);
  const dialogResolve = useRef<((saved: boolean) => void) | null>(null);
  const checking = useRef(false);
  const prompted = useRef(new Set<string>());
  const current =
    sessions.find(s => s.status === 'active') ||
    sessions.find(s => s.source === 'clock') ||
    null;
  const reviews = sessions.filter(s => s.status === 'needsReview');
  const latest = useRef({current, uid, pending, busy, dialog, user});
  latest.current = {current, uid, pending, busy, dialog, user};

  useEffect(
    () =>
      auth().onAuthStateChanged(account => {
        const accountId = account?.uid || null;
        owner.current = accountId;
        setUid(owner.current);
        setUser(null);
        setConfig(null);
        setSessions([]);
        setReady(false);
        setHasHistory(false);
        setPending(false);
        setPendingRequest(null);
        setError('');
        setBusy(false);
        setDialog(null);
        prompted.current.clear();
        dialogResolve.current?.(false);
        dialogResolve.current = null;
        queue.current = accountId
          ? new WorkSessionQueue(
              accountId,
              AsyncStorage,
              createWorkSessionRequestId,
              request => {
                if (
                  auth().currentUser?.uid !== accountId ||
                  owner.current !== accountId
                ) {
                  throw new Error('Please sign in again.');
                }
                return operateWorkSession(request);
              },
            )
          : null;
      }),
    [],
  );

  useEffect(() => {
    if (!uid) {
      return;
    }
    return firestore()
      .collection('Users')
      .doc(uid)
      .onSnapshot(
        doc => {
          setUser(doc.exists ? doc.data() || null : null);
        },
        () => setUser(null),
      );
  }, [uid]);

  const refresh = useCallback(async () => {
    const accountId = owner.current;
    if (!accountId) {
      return;
    }
    const fresh = await getWorkSessionConfig();
    if (owner.current === accountId) {
      setConfig(fresh);
      setReadRevision(value => value + 1);
    }
    try {
      const request = await queue.current?.pending();
      if (owner.current === accountId) {
        setPending(!!request);
        setPendingRequest(request || null);
      }
    } catch {
      if (owner.current === accountId) {
        setError('Could not restore your unfinished work update.');
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [uid, refresh]);

  const usable = canUseWorkRecords(user);
  useEffect(() => {
    if (!uid || !usable) {
      setSessions([]);
      setHasHistory(false);
      setReady(false);
      return;
    }
    let alive = true;
    hasWorkSessionHistory()
      .then(found => {
        if (alive) {
          setHasHistory(found);
        }
      })
      .catch(() => {});
    const unsubscribe = subscribeOpenWorkSessions(
      records => {
        if (!alive) {
          return;
        }
        setSessions(records);
        setReady(true);
        if (records.length) {
          setHasHistory(true);
        }
      },
      () => {
        if (alive) {
          setReady(false);
          setError(
            'Work records could not be refreshed. Reconnect before changing a timer.',
          );
        }
      },
    );
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [uid, usable, readRevision]);

  const run = useCallback(async (draft?: Draft) => {
    const accountId = owner.current;
    const runner = queue.current;
    if (!accountId || !runner || !canUseWorkRecords(latest.current.user)) {
      throw new Error('A usable cleaner account is required.');
    }
    setBusy(true);
    setError('');
    try {
      const result = await runner.run(draft);
      if (owner.current !== accountId) {
        throw new Error('The signed-in account changed.');
      }
      setHasHistory(true);
      return result;
    } catch (failure) {
      if (owner.current === accountId) {
        setError(
          (failure as Error).message || 'Could not save the work update.',
        );
      }
      throw failure;
    } finally {
      if (owner.current === accountId) {
        setBusy(false);
        const request = await runner.pending().catch(() => null);
        setPending(!!request);
        setPendingRequest(request);
      }
    }
  }, []);

  const closeDialog = useCallback((saved = false) => {
    setDialog(null);
    dialogResolve.current?.(saved);
    dialogResolve.current = null;
  }, []);

  const review = useCallback(async (session: WorkSession): Promise<boolean> => {
    if (
      latest.current.dialog ||
      !canUseWorkRecords(latest.current.user) ||
      session.cleanerId !== owner.current
    ) {
      return false;
    }
    return new Promise(resolve => {
      dialogResolve.current = resolve;
      setError('');
      setDialog({kind: 'finish', session});
    });
  }, []);

  const edit = useCallback(async (session: WorkSession): Promise<boolean> => {
    if (
      session.status !== 'confirmed' ||
      session.cleanerId !== owner.current ||
      latest.current.dialog ||
      !canUseWorkRecords(latest.current.user)
    ) {
      return false;
    }
    return new Promise(resolve => {
      dialogResolve.current = resolve;
      setError('');
      setDialog({kind: 'finish', session, editing: true});
    });
  }, []);
  const saveManual = useCallback(
    async (input: {
      startedAt: number;
      endedAt: number;
      reportingTimeZone: string;
      jobId?: string | null;
      note?: string;
    }) => run({...input, action: 'addManual'}),
    [run],
  );

  const stopSession = useCallback(
    async (session: WorkSession): Promise<boolean> => {
      try {
        const result = await run({action: 'clockOut', sessionId: session.id});
        if (result.status === 'confirmed') {
          return true;
        }
        if (result.status === 'needsReview') {
          const fresh = await getWorkSession(session.id);
          if (fresh) {
            return review(fresh);
          }
        }
        return false;
      } catch {
        return false;
      }
    },
    [run, review],
  );

  const checkSession = useCallback(
    async (resume = false) => {
      const state = latest.current;
      if (
        !state.current ||
        state.current.status !== 'active' ||
        !canUseWorkRecords(state.user) ||
        checking.current ||
        state.busy ||
        state.pending ||
        AppState.currentState !== 'active'
      ) {
        return;
      }
      const phase = workSessionPhase(state.current, Date.now());
      if (state.dialog && phase !== 'overdue') {
        return;
      }
      if (!resume && phase === 'working') {
        return;
      }
      if (
        !resume &&
        phase === 'checkIn' &&
        prompted.current.has(
          `${state.current.id}:${state.current.expectedEndAt}`,
        )
      ) {
        return;
      }
      checking.current = true;
      try {
        await run({action: 'reconcile', sessionId: state.current.id});
        if (owner.current !== state.uid) {
          return;
        }
        const fresh = await getWorkSession(state.current.id);
        if (
          fresh?.status !== 'active' &&
          latest.current.dialog?.kind === 'checkIn'
        ) {
          setDialog(null);
        }
        if (
          fresh?.status === 'active' &&
          workSessionPhase(fresh, Date.now()) === 'checkIn'
        ) {
          const promptKey = `${fresh.id}:${fresh.expectedEndAt}`;
          if (!resume && prompted.current.has(promptKey)) {
            return;
          }
          prompted.current.add(promptKey);
          setDialog({kind: 'checkIn', session: fresh});
        }
      } catch {
        /* Persisted request and error remain available for an explicit retry. */
      } finally {
        checking.current = false;
      }
    },
    [run],
  );

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
      void checkSession();
    }, 15000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setNow(Date.now());
        void refresh().then(() => checkSession(true));
      }
    });
    return () => {
      clearInterval(tick);
      listener.remove();
    };
  }, [refresh, checkSession]);
  useEffect(() => {
    if (current?.status === 'active') {
      void checkSession(true);
    }
  }, [current?.id, current?.status, checkSession]);

  useEffect(() => {
    const active = usable && current?.status === 'active' ? current : null;
    let alive = true;
    syncWorkReminder(uid, active)
      .then(ok => {
        if (alive) {
          setReminderUnavailable(!ok);
        }
      })
      .catch(() => {
        if (alive) {
          setReminderUnavailable(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [uid, usable, current]);

  useEffect(() => {
    if (!usable || !current?.jobId || current.status !== 'active') {
      return;
    }
    return firestore()
      .collection('Jobs')
      .doc(current.jobId)
      .onSnapshot(
        job => {
          if (
            !job.exists ||
            job.data()?.status !== 'confirmed' ||
            job.data()?.confirmedCleaner !== uid
          ) {
            void checkSession(true);
          }
        },
        () => {},
      );
  }, [usable, current?.id, current?.jobId, current?.status, uid, checkSession]);

  const start = async (jobId?: string) => {
    if (
      !config?.enabled ||
      !ready ||
      !canStartWork(user) ||
      current ||
      reviews.some(s => s.source === 'clock') ||
      pending ||
      busy ||
      dialog
    ) {
      return;
    }
    try {
      const job = jobId
        ? await firestore()
            .collection('Jobs')
            .doc(jobId)
            .get({source: 'server'})
        : null;
      if (
        jobId &&
        (!job?.exists ||
          job.data()?.status !== 'confirmed' ||
          job.data()?.confirmedCleaner !== uid)
      ) {
        throw new Error(
          'This job is no longer assigned and ready for clock-in.',
        );
      }
      const data = job?.data();
      if (
        jobId &&
        (typeof data?.expectedHours !== 'number' ||
          data.expectedHours <= 0 ||
          data.expectedHours > 12 ||
          !data.scheduledStartAt?.toMillis)
      ) {
        throw new Error(
          'This job needs an expected duration and saved schedule. Ask for a job update, or use General work.',
        );
      }
      const reportingTimeZone =
        (await AsyncStorage.getItem(`work-reporting-zone:${uid}`)) ||
        deviceWorkTimeZone();
      if (owner.current !== uid) {
        return;
      }
      setDialog({
        kind: 'start',
        jobId,
        title: data?.title || 'General work',
        reportingTimeZone,
        expectedEndAt: jobId
          ? data!.scheduledStartAt.toMillis() + data!.expectedHours * 3600000
          : null,
        config,
      });
    } catch (failure) {
      setError((failure as Error).message);
    }
  };

  const beforeJobAction = async (
    jobId: string,
    action: 'complete' | 'cancel',
  ) => {
    if (!config?.enabled && !hasHistory) {
      return true;
    }
    if (busy || pending) {
      setError('Retry the unfinished work update before changing this job.');
      return false;
    }
    try {
      const linked = (await getOpenWorkSessions()).filter(
        s => s.jobId === jobId && s.source === 'clock',
      );
      for (const session of linked) {
        if (session.status === 'needsReview' || action === 'cancel') {
          if (!(await review(session))) {
            return false;
          }
        } else {
          const accepted = await confirm(
            'Clock out and request completion?',
            'Your work hours will be saved first. The completion request is a separate step.',
            'Clock out',
          );
          if (!accepted || !(await stopSession(session))) {
            return false;
          }
        }
      }
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      return false;
    }
  };

  const retry = async () => {
    try {
      const request = await queue.current?.pending();
      const result = await run();
      if (request?.action === 'requestReview' && dialog?.kind === 'finish') {
        const fresh = await getWorkSession(result.sessionId);
        if (fresh) {
          setDialog({kind: 'finish', session: fresh});
        }
      } else if (
        dialog &&
        ['clockIn', 'confirm', 'edit', 'discard', 'setPlannedFinish'].includes(
          request?.action || '',
        )
      ) {
        closeDialog(true);
      }
      await refresh();
      return result;
    } catch {
      return null;
    }
  };

  return (
    <WorkContext.Provider
      value={{
        uid,
        user,
        enabled: !!config?.enabled,
        config: config || {...DEFAULT_WORK_SESSION_CONFIG},
        manualAvailable:
          canUseWorkRecords(user) &&
          manualWorkAvailable(
            config || {...DEFAULT_WORK_SESSION_CONFIG},
            user,
            now,
          ),
        ready,
        current,
        reviews,
        hasHistory,
        busy,
        pending,
        pendingRequest,
        error,
        reminderUnavailable,
        now,
        start,
        review,
        edit,
        saveManual,
        refresh,
        stop: async (record = current || undefined) =>
          record && record.cleanerId === uid ? stopSession(record) : false,
        retry,
        beforeJobAction,
        planFinish: () => {
          if (
            !current ||
            current.status !== 'active' ||
            current.jobId ||
            current.expectedEndAt !== null ||
            busy ||
            pending
          ) {
            return;
          }
          setDialog({
            kind: 'start',
            existingSessionId: current.id,
            title: 'General work',
            reportingTimeZone: current.reportingTimeZone,
            expectedEndAt: null,
            config: current.timingConfig,
            hardCapAt: current.autoStopAt,
          });
        },
      }}>
      {children}
      <WorkSessionDialog
        state={dialog}
        busy={busy}
        pending={pending}
        error={error}
        onClose={() => closeDialog(false)}
        onContinue={() => {
          closeDialog(false);
          void checkSession();
        }}
        onRetry={() => {
          void retry();
        }}
        onFinish={() => {
          if (dialog?.kind === 'checkIn') {
            setDialog({kind: 'finish', session: dialog.session});
          }
        }}
        onSave={async input => {
          if (!dialog) {
            return;
          }
          try {
            if (dialog.kind === 'start') {
              if (dialog.existingSessionId) {
                await run({
                  action: 'setPlannedFinish',
                  sessionId: dialog.existingSessionId,
                  plannedFinishAt: input.plannedFinishAt!,
                });
              } else {
                await AsyncStorage.setItem(
                  `work-reporting-zone:${uid}`,
                  input.reportingTimeZone!,
                );
                await run({
                  action: 'clockIn',
                  jobId: dialog.jobId || null,
                  reportingTimeZone: input.reportingTimeZone!,
                  ...(input.plannedFinishAt !== undefined
                    ? {plannedFinishAt: input.plannedFinishAt}
                    : {}),
                });
              }
            } else if (dialog.kind === 'finish') {
              if (input.discard) {
                await run({
                  action: 'discard',
                  sessionId: dialog.session.id,
                  note: input.note || '',
                  expectedRevision: dialog.session.revision ?? 0,
                });
              } else {
                let expectedRevision = dialog.session.revision ?? 0;
                if (dialog.session.status === 'active') {
                  const stopped = await run({
                    action: 'requestReview',
                    sessionId: dialog.session.id,
                    expectedRevision,
                  });
                  if (stopped.status !== 'needsReview') {
                    throw new Error('This session cannot be reviewed.');
                  }
                  expectedRevision = stopped.revision ?? 0;
                }
                const saved = await run({
                  action: dialog.editing ? 'edit' : 'confirm',
                  sessionId: dialog.session.id,
                  startedAt: input.startedAt!,
                  endedAt: input.endedAt!,
                  note: input.note || '',
                  expectedRevision,
                });
                if (saved.status !== 'confirmed') {
                  throw new Error('The work times have not been confirmed.');
                }
              }
            }
            closeDialog(true);
          } catch (failure) {
            setError((failure as Error).message);
          }
        }}
      />
    </WorkContext.Provider>
  );
};
