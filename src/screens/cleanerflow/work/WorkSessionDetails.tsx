import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {
  WorkRecordLayout,
  workRecordStyles as styles,
} from '../../../components/work/WorkRecordLayout';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {
  getOriginalWorkSessionEvent,
  getWorkSessionHistoryPage,
  subscribeWorkSession,
  WorkHistoryEvent,
} from '../../../services/workSessionService';
import type {WorkSession, WorkSessionAudit} from '../../../types/workSession';
import {
  canUseWorkRecords,
  formatWorkDuration,
} from '../../../utils/workSessionFlow';
import {
  detailedWorkTime,
  workAuditLabel,
  workStatusLabel,
  workStopExplanation,
} from '../../../utils/workSessionEntry';

const WorkSessionDetails = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'WorkSessionDetails'>) => {
  const work = useWorkSessions();
  const {uid} = work;
  const sessionId: string = route.params?.sessionId || '';
  const usable = canUseWorkRecords(work.user);
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [history, setHistory] = useState<WorkHistoryEvent[]>([]);
  const [original, setOriginal] = useState<WorkSessionAudit | null>(null);
  const [cursor, setCursor] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  const historyRequest = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setSession(null);
    setHistoryLoading(false);
    setHistoryError('');
    setCursor(null);
    setMore(false);
    setHistory([]);
    setOriginal(null);
    setError('');
    setLoading(true);
    if (!uid || !sessionId || !usable) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeWorkSession(
      sessionId,
      record => {
        if (generation.current !== current) {
          return;
        }
        setLoading(false);
        setSession(record);
        setError(
          record
            ? ''
            : 'This record is unavailable or does not belong to your account.',
        );
      },
      () => {
        if (generation.current !== current) {
          return;
        }
        setLoading(false);
        setSession(null);
        setHistory([]);
        setOriginal(null);
        setError('Could not load this work record. Reconnect and retry.');
      },
    );
    return () => {
      generation.current += 1;
      unsubscribe();
    };
  }, [uid, usable, sessionId, reload]);
  const loadHistory = useCallback(
    async (
      older = false,
      after?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
    ) => {
      if (!uid || !usable || !sessionId) {
        return;
      }
      const current = generation.current;
      const request = ++historyRequest.current;
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const [page, initial] = await Promise.all([
          getWorkSessionHistoryPage(sessionId, older ? after : null),
          older
            ? Promise.resolve(undefined)
            : getOriginalWorkSessionEvent(sessionId),
        ]);
        if (
          generation.current !== current ||
          request !== historyRequest.current ||
          auth().currentUser?.uid !== uid
        ) {
          return;
        }
        setHistory(prev => (older ? [...prev, ...page.events] : page.events));
        if (initial !== undefined) {
          setOriginal(initial);
        }
        setCursor(page.cursor);
        setMore(page.hasMore);
      } catch {
        if (
          generation.current === current &&
          request === historyRequest.current
        ) {
          setHistoryError(
            'Could not load the full history. Retry to check original times and changes.',
          );
        }
      } finally {
        if (
          generation.current === current &&
          request === historyRequest.current
        ) {
          setHistoryLoading(false);
        }
      }
    },
    [uid, usable, sessionId],
  );
  useEffect(() => {
    if (session) {
      void loadHistory();
    }
    // Refresh audit pages after a live record change, including recovery on another device.
  }, [session, loadHistory]);
  const timeText = (times: WorkSessionAudit['after'], zone: string) =>
    `${detailedWorkTime(times.startedAt, zone)} → ${
      times.endedAt === null ? 'Open' : detailedWorkTime(times.endedAt, zone)
    } · ${workStatusLabel(times.status)}`;
  return (
    <WorkRecordLayout
      title="Work record"
      onBack={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.navigate('WorkTracking')
      }>
      {!usable && (
        <Text style={styles.error}>
          Sign in with a usable cleaner account to view work records.
        </Text>
      )}
      {loading && <ActivityIndicator />}
      {!!error && (
        <TouchableOpacity onPress={() => setReload(value => value + 1)}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.link}>Retry record</Text>
        </TouchableOpacity>
      )}
      {usable && session?.cleanerId === uid && (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>
              {session.jobSnapshot?.title || 'General work'}
            </Text>
            <Text style={styles.help}>
              {workStatusLabel(session.status)} ·{' '}
              {session.source === 'manualCleaner'
                ? 'Entered by you'
                : 'Clock recorded'}
            </Text>
            <Text style={styles.title}>
              {session.status === 'confirmed'
                ? `${formatWorkDuration(session.durationMs)} confirmed`
                : session.status === 'needsReview'
                ? `${formatWorkDuration(
                    session.estimatedDurationMs,
                  )} estimated · not counted`
                : session.status === 'active'
                ? `${formatWorkDuration(
                    work.now - session.startedAt,
                  )} running · not counted`
                : 'Discarded · not counted'}
            </Text>
            <Text style={styles.help}>
              {timeText(session, session.reportingTimeZone)}
            </Text>
            <Text style={styles.help}>
              Reporting timezone: {session.reportingTimeZone}
            </Text>
            {session.status === 'needsReview' && (
              <Text style={styles.help}>
                {session.source === 'manualCleaner'
                  ? 'Check the dates and times you entered, then confirm them before the hours count.'
                  : workStopExplanation(session.stopReason)}
              </Text>
            )}
            {!!session.note && (
              <Text style={styles.help}>Note: {session.note}</Text>
            )}
          </View>
          {session.status === 'needsReview' && (
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                styles.button,
                (work.busy || work.pending) && styles.disabled,
              ]}
              disabled={work.busy || work.pending}
              onPress={() => {
                void work.review(session);
              }}>
              <Text style={styles.buttonText}>Review actual times</Text>
            </TouchableOpacity>
          )}
          {session.status === 'confirmed' && (
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                styles.button,
                (work.busy || work.pending) && styles.disabled,
              ]}
              disabled={work.busy || work.pending}
              onPress={() => {
                void work.edit(session);
              }}>
              <Text style={styles.buttonText}>Correct this record</Text>
            </TouchableOpacity>
          )}
          {session.status === 'active' && (
            <View style={styles.card}>
              <TouchableOpacity
                disabled={work.busy || work.pending}
                onPress={() => {
                  void work.stop(session);
                }}>
                <Text style={styles.link}>Clock out now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={work.busy || work.pending}
                onPress={() => {
                  void work.review(session);
                }}>
                <Text style={styles.link}>Enter actual finish time</Text>
              </TouchableOpacity>
            </View>
          )}
          {work.pending && (
            <TouchableOpacity
              disabled={work.busy}
              onPress={() => {
                void work.retry().catch(() => {});
              }}>
              <Text style={styles.error}>A work action needs checking.</Text>
              <Text style={styles.link}>Retry saved action</Text>
            </TouchableOpacity>
          )}
          {!!work.error && <Text style={styles.error}>{work.error}</Text>}
          <View style={styles.card}>
            <Text style={styles.title}>Saved rate context</Text>
            <Text style={styles.help}>
              Work type: {session.paySnapshot.basis}
            </Text>
            <Text style={styles.help}>
              {session.paySnapshot.hourlyRate === null
                ? 'No hourly rate was available when this record was created.'
                : `Hourly rate snapshot: $${session.paySnapshot.hourlyRate.toFixed(
                    2,
                  )} (${
                    session.paySnapshot.rateSource === 'job'
                      ? 'job rate'
                      : 'your default rate'
                  })`}
            </Text>
            <Text style={styles.help}>
              Saved{' '}
              {detailedWorkTime(
                session.paySnapshot.capturedAt,
                session.reportingTimeZone,
              )}
              . The saved job and rate remain with this record even if the job
              changes.
            </Text>
            <Text style={styles.help}>
              Collected earnings come from paid invoices in the month they were
              paid. This record contributes confirmed hours only.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Originally recorded</Text>
            {original ? (
              <Text style={styles.help}>
                {timeText(original.after, session.reportingTimeZone)}
              </Text>
            ) : (
              <Text style={styles.help}>
                {historyLoading
                  ? 'Loading original record…'
                  : 'Original times are unavailable. Retry the history below.'}
              </Text>
            )}
          </View>
          <Text style={styles.title}>Record history</Text>
          <Text style={styles.help}>
            Every correction and discard stays in the history. Discarded records
            contribute no hours.
          </Text>
          {history.map(event => (
            <View key={event.id} style={styles.card}>
              <Text style={styles.title}>{workAuditLabel(event.action)}</Text>
              <Text style={styles.help}>
                {detailedWorkTime(event.at, session.reportingTimeZone)} ·{' '}
                {event.actorId === uid ? 'You' : 'System'}
              </Text>
              {event.before && (
                <Text style={styles.help}>
                  Before: {timeText(event.before, session.reportingTimeZone)}
                </Text>
              )}
              <Text style={styles.help}>
                After: {timeText(event.after, session.reportingTimeZone)}
              </Text>
              {!!event.note && (
                <Text style={styles.help}>Note: {event.note}</Text>
              )}
              {!!event.stopReason && (
                <Text style={styles.help}>
                  {workStopExplanation(event.stopReason)}
                </Text>
              )}
            </View>
          ))}
          {!!historyError && (
            <TouchableOpacity
              disabled={historyLoading}
              onPress={() => {
                void loadHistory();
              }}>
              <Text style={styles.error}>{historyError}</Text>
              <Text style={styles.link}>Retry history</Text>
            </TouchableOpacity>
          )}
          {more && (
            <TouchableOpacity
              disabled={historyLoading}
              onPress={() => {
                void loadHistory(true, cursor);
              }}>
              <Text style={styles.link}>Load older changes</Text>
            </TouchableOpacity>
          )}
          {historyLoading && <ActivityIndicator />}
        </>
      )}
    </WorkRecordLayout>
  );
};
export default WorkSessionDetails;
