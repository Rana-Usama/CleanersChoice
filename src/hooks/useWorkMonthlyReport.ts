import {useCallback, useEffect, useMemo, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type {JobEarning} from '../types/jobEarning';
import type {WorkSession} from '../types/workSession';
import {useWorkSessions} from '../components/work/WorkSessionProvider';
import {subscribeWorkSessions} from '../services/workSessionService';
import {buildWorkMonthlyReport} from '../services/workMonthlyReport';
import {canUseWorkRecords} from '../utils/workSessionFlow';
import {WorkMonth, workMonthQueryRange} from '../utils/workMonth';

type ReportData = {
  key: string;
  sessions: WorkSession[] | null;
  jobEarnings: JobEarning[] | null;
  sessionsError: string;
  jobEarningsError: string;
  sessionsCached: boolean;
  jobEarningsCached: boolean;
};
const emptyData = (key: string): ReportData => ({
  key,
  sessions: null,
  jobEarnings: null,
  sessionsError: '',
  jobEarningsError: '',
  sessionsCached: false,
  jobEarningsCached: false,
});

export const useWorkMonthlyReport = ({year, month}: WorkMonth) => {
  const work = useWorkSessions();
  const focused = useIsFocused();
  const available =
    !!work.uid &&
    canUseWorkRecords(work.user) &&
    (work.enabled || work.hasHistory || !!work.current);
  const key = `${work.uid}:${year}:${month}`;
  const [retryNumber, setRetryNumber] = useState(0);
  const [data, setData] = useState<ReportData>(() => emptyData(key));
  useEffect(() => {
    if (!available || !focused || !work.uid) {
      return;
    }
    const uid = work.uid;
    let alive = true;
    setData(emptyData(key));
    const owned = () => alive && auth().currentUser?.uid === uid;
    const unsubscribeSessions = subscribeWorkSessions(
      workMonthQueryRange({year, month}),
      sessions => {
        if (!owned()) {
          return;
        }
        setData(previous => ({
          ...previous,
          sessions: sessions.filter(session => session.cleanerId === uid),
          sessionsError: '',
        }));
      },
      () => {
        if (owned()) {
          setData(previous => ({
            ...previous,
            sessions: null,
            sessionsError: 'Could not load all work for this month.',
          }));
        }
      },
      cached => {
        if (owned()) {
          setData(previous => ({...previous, sessionsCached: cached}));
        }
      },
    );
    // Fixed-price earnings use the completion ledger; invoice payments belong to Earnings.
    const {from, to} = workMonthQueryRange({year, month});
    const unsubscribeEarnings = firestore()
      .collection('JobEarnings')
      .where('cleanerId', '==', uid)
      .where('completedAt', '>=', from)
      .where('completedAt', '<', to)
      .onSnapshot(
        {includeMetadataChanges: true},
        snapshot => {
          if (!owned()) {
            return;
          }
          setData(previous => ({
            ...previous,
            jobEarnings: snapshot.docs
              .map(doc => doc.data() as JobEarning)
              .filter(entry => entry.cleanerId === uid),
            jobEarningsError: '',
            jobEarningsCached: snapshot.metadata.fromCache,
          }));
        },
        () => {
          if (owned()) {
            /*
              Fail open with an empty ledger rather than blocking the report.
              Confirmed hours are still correct; only accrued
              fixed-price money is missing, and the error is surfaced.
            */
            setData(previous => ({
              ...previous,
              jobEarnings: [],
              jobEarningsError: 'Could not load fixed-price job earnings.',
            }));
          }
        },
      );
    return () => {
      alive = false;
      unsubscribeSessions();
      unsubscribeEarnings();
    };
  }, [available, focused, work.uid, year, month, key, retryNumber]);
  const current = data.key === key && available ? data : emptyData(key);
  const reportClock = current.sessions?.some(
    session => session.status === 'active',
  )
    ? work.now
    : 0;
  const report = useMemo(
    () =>
      current.sessions && current.jobEarnings
        ? buildWorkMonthlyReport(
            current.sessions,
            [],
            {year, month},
            reportClock,
            current.jobEarnings,
          )
        : null,
    [current.sessions, current.jobEarnings, year, month, reportClock],
  );
  const retry = useCallback(() => setRetryNumber(value => value + 1), []);
  return {
    available,
    report,
    loading: available && !report && !current.sessionsError,
    error: [current.sessionsError, current.jobEarningsError]
      .filter(Boolean)
      .join(' '),
    fromCache: current.sessionsCached || current.jobEarningsCached,
    retry,
  };
};
