import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {
  workSessionTone,
  workStyles as styles,
} from '../../../components/work/workTheme';
import {WorkButton, WorkPill} from '../../../components/work/WorkUI';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {workCurrency} from '../../../services/workMonthlyReport';
import {Colors} from '../../../constants/Themes';
import {
  getOriginalWorkSessionEvent,
  getWorkSessionHistoryPage,
  subscribeWorkSession,
  WorkHistoryEvent,
} from '../../../services/workSessionService';
import type {WorkSession, WorkSessionAudit} from '../../../types/workSession';
import {cachedDateFormatter} from '../../../utils/intlCache';
import {
  canUseWorkRecords,
  formatWorkDuration,
  formatWorkTime,
  workSessionTitle,
} from '../../../utils/workSessionFlow';
import {
  detailedWorkTime,
  workAuditLabel,
  workStatusLabel,
  workStopExplanation,
} from '../../../utils/workSessionEntry';

/** "Saturday, 5 September 2026" in the record's own reporting zone. */
const longDate = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(time));

/** The month a record's hours land in, in its own reporting zone. */
const countedMonth = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(time));

/** One label/value line in the Times and Pay cards. */
const Line = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) => (
  <View style={[styles.rowBetween, styles.line]}>
    <Text style={[styles.sml, {flexBasis: 100, flexGrow: 1}]}>{label}</Text>
    {children ?? <Text style={[styles.body, styles.lineValue]}>{value}</Text>}
  </View>
);

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

  const busy = work.busy || work.pending;
  const tone = session ? workSessionTone(session) : 'confirmed';
  const zone = session?.reportingTimeZone || 'UTC';

  return (
    <WorkRecordLayout
      title="Work record"
      onBack={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.navigate('WorkTracking')
      }
      footer={
        usable &&
        session?.cleanerId === uid &&
        session.status !== 'discarded' ? (
          <>
            {/* ---- actions -------------------------------------------- */}
            {session.status === 'needsReview' && (
              <WorkButton
                label="Review actual times"
                disabled={busy}
                onPress={() => {
                  void work.review(session);
                }}
              />
            )}
            {session.status === 'confirmed' && (
              <WorkButton
                variant="ghost"
                icon="pencil-outline"
                label="Correct this record"
                disabled={busy}
                onPress={() => {
                  void work.edit(session);
                }}
              />
            )}
            {session.status === 'active' && (
              <View style={styles.actionRow}>
                <WorkButton
                  variant="danger"
                  icon="stop"
                  label="Clock out now"
                  disabled={busy}
                  onPress={() => {
                    void work.stop(session);
                  }}
                  style={styles.actionCell}
                />
                <WorkButton
                  variant="ghost"
                  label="Enter actual finish time"
                  disabled={busy}
                  onPress={() => {
                    void work.review(session);
                  }}
                  style={styles.actionCell}
                />
              </View>
            )}

            {session.status !== 'active' && (
              <WorkButton
                variant="ghost"
                label="Discard record"
                icon="trash-can-outline"
                disabled={busy}
                onPress={() => {
                  void (session.status === 'confirmed'
                    ? work.edit(session, true)
                    : work.review(session, true));
                }}
              />
            )}
          </>
        ) : undefined
      }>
      {!usable && (
        <Text style={styles.error}>
          Sign in with a usable cleaner account to view work records.
        </Text>
      )}
      {loading && <ActivityIndicator color={Colors.gradient1} />}
      {!!error && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setReload(value => value + 1)}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.link}>Retry record</Text>
        </TouchableOpacity>
      )}

      {usable && session?.cleanerId === uid && (
        <>
          {/* ---- headline ------------------------------------------- */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sml, styles.grow]}>
                {longDate(session.startedAt, zone)}
              </Text>
              <WorkPill tone={tone} />
            </View>
            <Text style={styles.big}>
              {session.status === 'confirmed'
                ? formatWorkDuration(session.durationMs)
                : session.status === 'needsReview'
                ? formatWorkDuration(session.estimatedDurationMs)
                : session.status === 'active'
                ? formatWorkDuration(work.now - session.startedAt)
                : '0h 0m'}
            </Text>
            <Text style={styles.sml}>
              {session.status === 'confirmed'
                ? 'confirmed'
                : session.status === 'needsReview'
                ? 'estimated · not counted'
                : session.status === 'active'
                ? 'running · not counted'
                : 'Discarded · not counted'}
            </Text>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={[styles.body, styles.grow]} numberOfLines={2}>
                {workSessionTitle(session)}
              </Text>
              <Text style={styles.sml}>
                {session.source === 'manualCleaner'
                  ? 'Entered by you'
                  : 'Clock recorded'}
              </Text>
            </View>
            {session.status === 'needsReview' && (
              <Text style={styles.error}>
                {session.source === 'manualCleaner'
                  ? 'Check the dates and times you entered, then confirm them before the hours count.'
                  : workStopExplanation(session.stopReason)}
              </Text>
            )}
            {!!session.note && (
              <Text style={styles.help}>Note: {session.note}</Text>
            )}
          </View>

          {/* ---- times ---------------------------------------------- */}
          <View style={styles.card}>
            <Text style={styles.title}>Times</Text>
            <View style={styles.divider} />
            <Line
              label="Clocked in"
              value={formatWorkTime(session.startedAt, zone)}
            />
            <Line
              label="Clocked out"
              value={
                session.endedAt === null
                  ? 'Open'
                  : formatWorkTime(session.endedAt, zone)
              }
            />
            <Line label="Recorded by">
              <WorkPill
                tone={tone}
                label={
                  session.source === 'manualCleaner'
                    ? 'Entered manually'
                    : session.stopReason
                    ? 'Auto-stopped'
                    : 'Clock in / clock out'
                }
              />
            </Line>
            <Line
              label="Counted in"
              value={
                session.endedAt !== null &&
                session.endedAt > session.startedAt &&
                countedMonth(session.startedAt, zone) !==
                  countedMonth(session.endedAt - 1, zone)
                  ? `${countedMonth(session.startedAt, zone)} / ${countedMonth(
                      session.endedAt - 1,
                      zone,
                    )}`
                  : countedMonth(session.startedAt, zone)
              }
            />
            <Text style={styles.sml}>{timeText(session, zone)}</Text>
          </View>

          {work.pending && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={work.busy}
              onPress={() => {
                void work.retry().catch(() => {});
              }}>
              <Text style={styles.error}>A work action needs checking.</Text>
              <Text style={styles.link}>Retry saved action</Text>
            </TouchableOpacity>
          )}
          {!!work.error && <Text style={styles.error}>{work.error}</Text>}

          {/* ---- pay ------------------------------------------------ */}
          {!session.jobId ? (
            <View style={styles.card}>
              <Text style={styles.title}>
                {session.status === 'confirmed'
                  ? 'Earned'
                  : 'Expected earnings'}
              </Text>
              <Text style={styles.hero}>
                {session.expectedEarnings !== undefined
                  ? workCurrency(session.expectedEarnings)
                  : 'Not set'}
              </Text>
              {/* <Text style={styles.sml}>
                {session.status === 'discarded'
                  ? 'This record is discarded and contributes no earnings.'
                  : 'Total for this work. Counts once in the finish month after the hours are confirmed.'}
              </Text> */}
              {session.status !== 'discarded' && (
                <WorkButton
                  label="Edit earnings"
                  variant="ghost"
                  icon="pencil-outline"
                  disabled={work.busy || work.pending}
                  onPress={() => {
                    void work.editEarnings(session);
                  }}
                />
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={[styles.title, styles.grow]}>Pay</Text>
                <WorkPill tone="active" label="Snapshotted at clock-in" />
              </View>
              <View style={styles.divider} />
              <Line
                label="Work type"
                value={
                  session.paySnapshot.basis === 'hourly'
                    ? 'Hourly'
                    : session.paySnapshot.basis === 'flat'
                    ? 'Fixed price'
                    : session.paySnapshot.basis === 'sqft'
                    ? 'Per square foot'
                    : 'General work'
                }
              />
              <Line
                label="Rate applied"
                value={
                  session.paySnapshot.hourlyRate === null
                    ? 'None recorded'
                    : `$${session.paySnapshot.hourlyRate.toFixed(2)}/hr`
                }
              />
              <Line
                label="Rate source"
                value={
                  session.paySnapshot.hourlyRate === null
                    ? 'No hourly rate was available'
                    : session.paySnapshot.rateSource === 'job'
                    ? 'Job rate'
                    : 'Your default rate'
                }
              />
              <View style={styles.inner}>
                <Text style={styles.sml}>
                  Saved {detailedWorkTime(session.paySnapshot.capturedAt, zone)}
                  . The saved job and rate remain with this record even if the
                  job changes.
                </Text>
              </View>
            
              {(session.paySnapshot.basis === 'hourly' ||
                session.paySnapshot.basis === 'general') &&
                session.paySnapshot.hourlyRate !== null &&
                session.status === 'confirmed' && (
                  <Line
                    label="This session earned"
                    value={`$${(
                      (session.durationMs / 3600000) *
                      session.paySnapshot.hourlyRate
                    ).toFixed(2)}`}
                  />
                )}
              {(session.paySnapshot.basis === 'hourly' ||
                session.paySnapshot.basis === 'general') &&
                session.paySnapshot.hourlyRate === null && (
                  <Text style={[styles.sml, {color: Colors.amberDarkText}]}>
                    No rate was saved at clock-in, so these hours are not
                    valued. Set a default hourly rate to value future sessions.
                  </Text>
                )}
              <Text style={styles.sml}>
                Hours count after confirmation. Hourly earnings use the rate
                saved with this record; fixed-price earnings belong to the
                completed job.
              </Text>
            </View>
          )}

          {/* ---- original + history --------------------------------- */}
          <View style={styles.card}>
            <Text style={styles.title}>Originally recorded</Text>
            {original ? (
              <Text style={styles.help}>{timeText(original.after, zone)}</Text>
            ) : (
              <Text style={styles.help}>
                {historyLoading
                  ? 'Loading original record…'
                  : 'Original times are unavailable. Retry the history below.'}
              </Text>
            )}
          </View>

          {/* <Text style={styles.title}>Edit history</Text>
          <Text style={styles.sml}>
            Every correction and discard stays in the history. Discarded records
            contribute no hours.
          </Text> */}
          {/* {history.length > 0 && (
            <View style={styles.card}>
              {history.map((event, index) => (
                <View key={event.id} style={styles.row}>
                  <View style={styles.timelineRail}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor:
                            event.actorId === uid
                              ? Colors.gradient1
                              : Colors.amber500,
                        },
                      ]}
                    />
                    {index < history.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  <View style={[styles.grow, styles.timelineBody]}>
                    <Text style={styles.body}>
                      {workAuditLabel(event.action)}
                    </Text>
                    <Text style={styles.sml}>
                      {detailedWorkTime(event.at, zone)} ·{' '}
                      {event.actorId === uid ? 'You' : 'System'}
                    </Text>
                    {event.before && (
                      <Text style={styles.sml}>
                        Before: {timeText(event.before, zone)}
                      </Text>
                    )}
                    <Text style={styles.sml}>
                      After: {timeText(event.after, zone)}
                    </Text>
                    {event.afterExpectedEarnings !== undefined && (
                      <Text style={styles.sml}>
                        Earnings:{' '}
                        {event.beforeExpectedEarnings == null
                          ? 'Not set'
                          : workCurrency(event.beforeExpectedEarnings)}
                        {' → '}
                        {event.afterExpectedEarnings == null
                          ? 'Not set'
                          : workCurrency(event.afterExpectedEarnings)}
                      </Text>
                    )}
                    {!!event.note && (
                      <Text style={styles.sml}>Note: {event.note}</Text>
                    )}
                    {!!event.stopReason && (
                      <Text style={styles.sml}>
                        {workStopExplanation(event.stopReason)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )} */}
          {!!historyError && (
            <TouchableOpacity
              accessibilityRole="button"
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
              accessibilityRole="button"
              disabled={historyLoading}
              onPress={() => {
                void loadHistory(true, cursor);
              }}>
              <Text style={styles.link}>Load older changes</Text>
            </TouchableOpacity>
          )}
          {historyLoading && <ActivityIndicator color={Colors.gradient1} />}
        </>
      )}
    </WorkRecordLayout>
  );
};
export default WorkSessionDetails;
