import {useCallback, useEffect, useMemo, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type {Invoice} from '../types/invoice';
import type {WorkSession} from '../types/workSession';
import {useWorkSessions} from '../components/work/WorkSessionProvider';
import {subscribeWorkSessions} from '../services/workSessionService';
import {buildWorkMonthlyReport} from '../services/workMonthlyReport';
import {canUseWorkRecords} from '../utils/workSessionFlow';
import {WorkMonth, workMonthQueryRange} from '../utils/workMonth';

type ReportData = {
  key: string;
  sessions: WorkSession[] | null;
  invoices: Invoice[] | null;
  sessionsError: string;
  invoicesError: string;
  sessionsCached: boolean;
  invoicesCached: boolean;
};
const emptyData = (key: string): ReportData => ({
  key,
  sessions: null,
  invoices: null,
  sessionsError: '',
  invoicesError: '',
  sessionsCached: false,
  invoicesCached: false,
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
    // Legacy paidAt values have several representations. Read the owned ledger
    // rather than excluding legacy payments with a Firestore Timestamp-only range.
    const unsubscribeInvoices = firestore()
      .collection('Invoices')
      .where('cleanerId', '==', uid)
      .onSnapshot(
        {includeMetadataChanges: true},
        snapshot => {
          if (!owned()) {
            return;
          }
          const invoices = snapshot.docs
            .map(doc => ({...doc.data(), id: doc.id} as Invoice))
            .filter(invoice => invoice.cleanerId === uid);
          setData(previous => ({
            ...previous,
            invoices,
            invoicesError: '',
            invoicesCached: snapshot.metadata.fromCache,
          }));
        },
        () => {
          if (owned()) {
            setData(previous => ({
              ...previous,
              invoices: null,
              invoicesError: 'Could not load the invoice totals.',
            }));
          }
        },
      );
    return () => {
      alive = false;
      unsubscribeSessions();
      unsubscribeInvoices();
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
      current.sessions && current.invoices
        ? buildWorkMonthlyReport(
            current.sessions,
            current.invoices,
            {year, month},
            reportClock,
          )
        : null,
    [current.sessions, current.invoices, year, month, reportClock],
  );
  const retry = useCallback(() => setRetryNumber(value => value + 1), []);
  return {
    available,
    report,
    loading:
      available && !report && !current.sessionsError && !current.invoicesError,
    error: [current.sessionsError, current.invoicesError]
      .filter(Boolean)
      .join(' '),
    fromCache: current.sessionsCached || current.invoicesCached,
    retry,
  };
};
