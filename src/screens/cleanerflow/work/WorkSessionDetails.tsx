import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {
  WorkTone,
  workSessionTone,
  workStyles as styles,
  workToneStyle,
} from '../../../components/work/workTheme';
import {WorkButton} from '../../../components/work/WorkUI';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {workCurrency} from '../../../services/workMonthlyReport';
import {Colors, Fonts} from '../../../constants/Themes';
import {HOUR_MS} from '../../../../functions/src/workSessions/model';
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
  workSessionTitle,
} from '../../../utils/workSessionFlow';
import {
  workAuditLabel,
  workStopExplanation,
} from '../../../utils/workSessionEntry';

/** "Saturday, 10 October 2026" in the record's own reporting zone. */
const longDate = (time: number, timeZone: string) => {
  const date = new Date(time);
  return `${cachedDateFormatter('en-GB', {timeZone, weekday: 'long'}).format(
    date,
  )}, ${cachedDateFormatter('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)}`;
};
/** "7:20 PM" */
const clockTime = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(time));
/** "Sat 10 Oct" */
const shortDay = (time: number, timeZone: string) =>
  cachedDateFormatter('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(time));
/** "34 min" under an hour, otherwise "2h 05m"-style duration. */
const minutesText = (ms: number) =>
  ms < HOUR_MS ? `${Math.floor(ms / 60000)} min` : formatWorkDuration(ms);
/** Status dot inside the band's translucent pill. */
const HERO_DOT: Record<WorkTone, string> = {
  confirmed: '#6EE7B7',
  edited: '#6EE7B7',
  needsReview: '#FCD34D',
  active: '#BFDBFE',
  discarded: '#CBD5E1',
};

/** The month a record's hours land in, in its own reporting zone. */
const countedMonth = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(time));

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

  const busy = work.busy || work.pending;
  const tone = session ? workSessionTone(session) : 'confirmed';
  const zone = session?.reportingTimeZone || 'UTC';

  /* ---- derived headline values (presentation only) ------------------- */
  const status = session?.status;
  const shownMs = !session
    ? 0
    : status === 'confirmed'
    ? session.durationMs
    : status === 'needsReview'
    ? session.estimatedDurationMs
    : status === 'active'
    ? Math.max(0, work.now - session.startedAt)
    : 0;
  const basis = session?.paySnapshot?.basis;
  const rate = session?.paySnapshot?.hourlyRate ?? null;
  const linked = !!session?.jobId;
  const hourlyPay = linked && (basis === 'hourly' || basis === 'general');
  const amount: number | null = !session
    ? null
    : !linked
    ? typeof session.expectedEarnings === 'number'
      ? session.expectedEarnings
      : null
    : hourlyPay &&
      rate !== null &&
      (status === 'confirmed' || status === 'needsReview')
    ? (shownMs / HOUR_MS) * rate
    : null;
  const moneyLine =
    status === 'discarded'
      ? 'not counted'
      : status === 'active'
      ? 'running · not counted'
      : amount !== null
      ? `${workCurrency(amount)} ${
          status === 'needsReview' ? 'once confirmed' : 'earned'
        }`
      : status === 'needsReview'
      ? 'not counted yet'
      : linked && !hourlyPay
      ? 'paid with the job'
      : '';
  const railColor =
    status === 'needsReview'
      ? Colors.amber500
      : status === 'active'
      ? '#BFDBFE'
      : status === 'discarded'
      ? Colors.gray300
      : Colors.gradient1;
  const railLabel =
    status === 'needsReview'
      ? `${minutesText(shownMs)} · estimated`
      : status === 'active'
      ? `${minutesText(shownMs)} so far`
      : status === 'discarded'
      ? 'Not counted'
      : `${minutesText(shownMs)} worked`;
  const counted = session
    ? session.endedAt !== null &&
      session.endedAt > session.startedAt &&
      countedMonth(session.startedAt, zone) !==
        countedMonth(session.endedAt - 1, zone)
      ? `${countedMonth(session.startedAt, zone)} / ${countedMonth(
          session.endedAt - 1,
          zone,
        )}`
      : countedMonth(session.startedAt, zone)
    : '';
  const sourceLabel =
    session?.source === 'manualCleaner'
      ? 'Entered by you'
      : session?.stopReason
      ? 'Auto-stopped'
      : 'Clock recorded';
  const range = (startedAt: number, endedAt: number | null) => {
    const text = `${clockTime(startedAt, zone)} – ${
      endedAt === null ? 'Open' : clockTime(endedAt, zone)
    }`;
    return session &&
      shortDay(startedAt, zone) !== shortDay(session.startedAt, zone)
      ? `${shortDay(startedAt, zone)} · ${text}`
      : text;
  };
  const unchanged =
    !!original &&
    !!session &&
    original.after.startedAt === session.startedAt &&
    original.after.endedAt === session.endedAt;
  const owned = usable && session?.cleanerId === uid;

  const hero =
    owned && session ? (
      <View style={d.hero}>
        <Text style={d.heroDate}>{longDate(session.startedAt, zone)}</Text>
        <Text style={d.heroDuration}>{formatWorkDuration(shownMs)}</Text>
        <View style={d.heroMeta}>
          <View style={d.heroPill}>
            <View style={[d.heroDot, {backgroundColor: HERO_DOT[tone]}]} />
            <Text style={d.heroPillText}>{workToneStyle(tone).label}</Text>
          </View>
          {!!moneyLine && <Text style={d.heroMoney}>· {moneyLine}</Text>}
        </View>
      </View>
    ) : undefined;

  return (
    <WorkRecordLayout
      title="Work record"
      hero={hero}
      onBack={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.navigate('WorkTracking')
      }
      footer={
        owned && session && session.status !== 'discarded' ? (
          session.status === 'active' ? (
            <View style={d.footerRow}>
              <WorkButton
                variant="danger"
                icon="stop"
                label="Clock out now"
                disabled={busy}
                onPress={() => {
                  void work.stop(session);
                }}
                style={d.grow}
              />
              <WorkButton
                variant="ghost"
                label="Enter finish time"
                accessibilityLabel="Enter actual finish time"
                disabled={busy}
                onPress={() => {
                  void work.review(session);
                }}
                style={d.grow}
              />
            </View>
          ) : (
            <View style={d.footerRow}>
              <WorkButton
                variant="dangerOutline"
                icon="trash-can-outline"
                label="Discard"
                accessibilityLabel="Discard record"
                disabled={busy}
                onPress={() => {
                  void (session.status === 'confirmed'
                    ? work.edit(session, true)
                    : work.review(session, true));
                }}
                style={d.grow}
              />
              <WorkButton
                label={
                  session.status === 'needsReview'
                    ? 'Review actual times'
                    : 'Correct record'
                }
                accessibilityLabel={
                  session.status === 'needsReview'
                    ? 'Review actual times'
                    : 'Correct this record'
                }
                disabled={busy}
                onPress={() => {
                  void (session.status === 'needsReview'
                    ? work.review(session)
                    : work.edit(session));
                }}
                style={d.primary}
              />
            </View>
          )
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

      {owned && session && (
        <>
          {/* ---- what it was ---------------------------------------- */}
          <View style={d.card}>
            <View style={d.workRow}>
              <View style={d.workIcon}>
                <MaterialCommunityIcons
                  name={linked ? 'briefcase-outline' : 'broom'}
                  size={19}
                  color={Colors.gradient1}
                />
              </View>
              <View style={d.grow}>
                <Text style={d.workTitle} numberOfLines={2}>
                  {workSessionTitle(session)}
                </Text>
                <Text style={d.sub}>
                  {sourceLabel} · counted in {counted}
                </Text>
              </View>
            </View>
            {!!session.note && <Text style={d.note}>Note: {session.note}</Text>}
          </View>

          {session.status === 'needsReview' && (
            <View style={d.notice}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={Colors.amberDarkText}
              />
              <Text style={d.noticeText}>
                {session.source === 'manualCleaner'
                  ? 'Check the dates and times you entered, then confirm them before the hours count.'
                  : workStopExplanation(session.stopReason)}
              </Text>
            </View>
          )}

          {/* ---- when: two stops with the length on the rail ---------- */}
          <View style={d.card}>
            <View style={d.timeline}>
              <View style={d.railCol}>
                <View style={[d.dot, {backgroundColor: railColor}]} />
                <View style={[d.rail, {backgroundColor: railColor}]} />
                <View
                  style={[
                    d.dot,
                    session.endedAt === null
                      ? d.dotOpen
                      : {backgroundColor: railColor},
                  ]}
                />
              </View>
              <View style={d.grow}>
                <View style={d.stop}>
                  <View>
                    <Text style={d.stopLabel}>Clocked in</Text>
                    <Text style={d.stopTime}>
                      {clockTime(session.startedAt, zone)}
                    </Text>
                  </View>
                  <Text style={d.stopDay}>
                    {shortDay(session.startedAt, zone)}
                  </Text>
                </View>
                <View style={d.railPillWrap}>
                  <Text style={d.railPill}>{railLabel}</Text>
                </View>
                <View style={d.stop}>
                  <View>
                    <Text style={d.stopLabel}>Clocked out</Text>
                    <Text style={d.stopTime}>
                      {session.endedAt === null
                        ? 'Still running'
                        : clockTime(session.endedAt, zone)}
                    </Text>
                  </View>
                  {session.endedAt !== null && (
                    <Text style={d.stopDay}>
                      {shortDay(session.endedAt, zone)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
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

          {/* ---- how it's paid, as the sum it is ---------------------- */}
          <View style={[d.card, d.payCard]}>
            <Text style={d.cardTitle}>How it's paid</Text>
            {!linked ? (
              <>
                <View style={d.payRow}>
                  <Text style={d.payFormula}>Total for this work</Text>
                  <Text style={[d.payAmount, amount === null && d.payUnset]}>
                    {amount !== null ? workCurrency(amount) : 'Not set'}
                  </Text>
                </View>
                <Text style={d.sub}>
                  {session.status === 'discarded'
                    ? 'This record is discarded and contributes no earnings.'
                    : 'Counts once, after the hours are confirmed.'}
                </Text>
                {session.status !== 'discarded' && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={work.busy || work.pending}
                    onPress={() => {
                      void work.editEarnings(session);
                    }}
                    style={d.editLink}>
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={15}
                      color={Colors.gradient1}
                    />
                    <Text style={d.editLinkText}>Edit earnings</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : hourlyPay && rate !== null ? (
              <>
                <View style={d.payRow}>
                  <Text style={d.payFormula}>
                    {formatWorkDuration(shownMs)} × ${rate.toFixed(2)}/hr
                  </Text>
                  <Text style={d.payAmount}>
                    {amount !== null ? workCurrency(amount) : '—'}
                  </Text>
                </View>
                <Text style={d.sub}>
                  {session.paySnapshot.rateSource === 'job'
                    ? 'Hourly job rate'
                    : 'Your default rate'}
                  , saved at clock-in.
                </Text>
              </>
            ) : hourlyPay ? (
              <>
                <View style={d.payRow}>
                  <Text style={d.payFormula}>No rate saved</Text>
                  <Text style={[d.payAmount, d.payUnset]}>—</Text>
                </View>
                <Text style={[d.sub, {color: Colors.amberDarkText}]}>
                  No rate was saved at clock-in, so these hours are not valued.
                  Set a default hourly rate to value future sessions.
                </Text>
              </>
            ) : (
              <>
                <View style={d.payRow}>
                  <Text style={d.payFormula}>
                    {basis === 'sqft' ? 'Per square foot' : 'Fixed price'}
                  </Text>
                  <Text style={[d.payAmount, d.payUnset]}>
                    Paid with the job
                  </Text>
                </View>
                <Text style={d.sub}>
                  Fixed-price earnings belong to the completed job.
                </Text>
              </>
            )}
          </View>

          {/* ---- original record, one honest line ---------------------- */}
          <View style={[d.card, d.workRow]}>
            <View style={d.grow}>
              <Text style={d.stopLabel}>Originally recorded</Text>
              <Text style={d.historyValue}>
                {original
                  ? range(original.after.startedAt, original.after.endedAt)
                  : historyLoading
                  ? 'Loading original record…'
                  : 'Original times are unavailable. Retry the history below.'}
              </Text>
            </View>
            {!!original && (
              <Text style={[d.chip, !unchanged && d.chipEdited]}>
                {unchanged ? 'Unchanged' : 'Edited'}
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

const d = StyleSheet.create({
  grow: {flex: 1, minWidth: 0},
  hero: {alignItems: 'center', gap: 4},
  heroDate: {fontFamily: Fonts.fontRegular, fontSize: 13, color: Colors.white},
  heroDuration: {
    fontFamily: Fonts.fontBold,
    fontSize: 42,
    lineHeight: 50,
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroDot: {width: 7, height: 7, borderRadius: 4},
  heroPillText: {fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.white},
  heroMoney: {fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white},
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.slateText,
  },
  workRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  workIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.blueBg200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.slateText,
  },
  sub: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.secondaryText,
  },
  note: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.slateText,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.amberBg50,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  noticeText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.amberDarkText,
  },
  timeline: {flexDirection: 'row', gap: 12},
  railCol: {width: 14, alignItems: 'center', paddingTop: 5},
  dot: {width: 12, height: 12, borderRadius: 6},
  dotOpen: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: Colors.white,
  },
  rail: {flex: 1, width: 2, minHeight: 36, marginVertical: 4},
  stop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  stopLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  stopTime: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    color: Colors.slateText,
    fontVariant: ['tabular-nums'],
  },
  stopDay: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
    paddingBottom: 3,
  },
  railPillWrap: {paddingVertical: 10, alignItems: 'flex-start'},
  railPill: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.gradient1,
    backgroundColor: Colors.blueBg200,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  payCard: {gap: 8},
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  payFormula: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: 13.5,
    color: Colors.secondaryText,
    fontVariant: ['tabular-nums'],
  },
  payAmount: {
    fontFamily: Fonts.fontBold,
    fontSize: 17,
    color: '#047857',
    fontVariant: ['tabular-nums'],
  },
  payUnset: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: Colors.secondaryText,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 36,
  },
  editLinkText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.gradient1,
  },
  historyValue: {
    fontFamily: Fonts.fontMedium,
    fontSize: 13.5,
    color: Colors.slateText,
  },
  chip: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
    color: Colors.secondaryText,
    backgroundColor: Colors.slate100,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipEdited: {color: Colors.gradient1, backgroundColor: Colors.blueBg200},
  footerRow: {flexDirection: 'row', gap: 10},
  primary: {flex: 1.7, minWidth: 0},
});
export default WorkSessionDetails;
