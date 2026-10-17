import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {
  buildDayTotals,
  WorkMonthCalendar,
  workDayOf,
} from '../../../components/work/WorkMonthCalendar';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {useWorkMonthlyReport} from '../../../hooks/useWorkMonthlyReport';
import {getMonthLabel} from '../../../services/earningsService';
import {
  recordEarned,
  workCurrency,
} from '../../../services/workMonthlyReport';
import type {MonthWorkRecord} from '../../../services/workMonthlyReport';
import {Colors, Fonts} from '../../../constants/Themes';
import {cachedDateFormatter} from '../../../utils/intlCache';
import {
  formatWorkDuration,
  workSessionTitle,
} from '../../../utils/workSessionFlow';
import {shiftWorkMonth, WorkMonth} from '../../../utils/workMonth';

const PAGE = 25;

/**
 * "2:14 PM", time only. formatWorkTime includes the date ("Oct 20, 11:00 AM"),
 * which doubled up next to the row's own "17 Oct" prefix.
 */
const clock = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time));

/** "17 Oct", in the record's own reporting zone. */
const dayMonth = (time: number, timeZone: string) =>
  cachedDateFormatter('en-GB', {timeZone, day: 'numeric', month: 'short'}).format(
    new Date(time),
  );

const workedMs = (item: MonthWorkRecord) =>
  item.confirmedMs || item.pendingMs || item.runningMs || 0;

/** Status dot: green counted, amber awaiting review, blue running, grey else. */
const dotColor = (item: MonthWorkRecord) =>
  item.runningMs > 0
    ? '#407BFF'
    : item.pendingMs > 0
    ? '#F59E0B'
    : item.confirmedMs > 0
    ? '#10B981'
    : '#9CA3AF';

const WorkHours = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'WorkHours'>) => {
  const work = useWorkSessions();
  const [selected, setSelected] = useState<WorkMonth>(() => {
    const date = new Date(work.now);
    const value = route.params;
    return value &&
      Number.isInteger(value.year) &&
      value.year >= 1970 &&
      value.year < 9999 &&
      Number.isInteger(value.month) &&
      value.month >= 0 &&
      value.month < 12
      ? value
      : {year: date.getFullYear(), month: date.getMonth()};
  });
  const monthly = useWorkMonthlyReport(selected);
  const report = monthly.report;
  const [picker, setPicker] = useState(false);
  // The calendar day the list is narrowed to; null shows the whole month.
  const [day, setDay] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);

  // Day 17 of one month means nothing in the next.
  useEffect(() => {
    setDay(null);
    setShown(PAGE);
  }, [selected.year, selected.month, work.uid]);

  const dayTotals = useMemo(() => buildDayTotals(report), [report]);

  const records = (report?.records ?? []).filter(
    item =>
      workedMs(item) > 0 &&
      (day === null ||
        workDayOf(item.session.startedAt, item.session.reportingTimeZone) ===
          day),
  );
  const shownMs = records.reduce((sum, item) => sum + workedMs(item), 0);

  const monthLabel = `${getMonthLabel(selected.month)} ${selected.year}`;
  const listTitle =
    day === null
      ? 'All sessions'
      : cachedDateFormatter('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(new Date(selected.year, selected.month, day));

  return (
    <WorkRecordLayout
      flat
      title="Work Hours"
      onBack={() => navigation.goBack()}
      actionIcon={work.manualAvailable ? 'plus' : undefined}
      actionLabel="Add a record"
      onAction={
        work.manualAvailable
          ? () => navigation.navigate('ManualWorkEntry')
          : undefined
      }>
      {!monthly.available ? (
        <View style={styles.card}>
          <Text style={styles.empty}>
            Monthly tracking is available to eligible cleaners when tracking is
            enabled or existing work history is available.
          </Text>
        </View>
      ) : (
        <>
          <WorkMonthCalendar
            month={selected}
            monthLabel={monthLabel}
            report={report}
            totals={dayTotals}
            selectedDay={day}
            onSelectDay={setDay}
            onPickMonth={() => setPicker(true)}
            onPrevMonth={() => setSelected(value => shiftWorkMonth(value, -1))}
            onNextMonth={() => setSelected(value => shiftWorkMonth(value, 1))}
            prevDisabled={selected.year === 1970 && selected.month === 0}
            nextDisabled={selected.year === 9998 && selected.month === 11}
          />

          {/* Only shown when something is wrong or needs a decision. */}
          {monthly.loading && !report && (
            <View style={[styles.card, styles.noticeRow]}>
              <ActivityIndicator color={Colors.gradient1} />
              <Text style={styles.noticeText}>
                Loading work hours and earnings…
              </Text>
            </View>
          )}
          {!!monthly.error && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={monthly.retry}
              style={[styles.card, styles.noticeRow]}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={Colors.amberDarkText}
              />
              <Text style={[styles.noticeText, styles.warnText]}>
                {monthly.error}
              </Text>
              <Text style={styles.link}>Retry monthly totals</Text>
            </TouchableOpacity>
          )}
          {monthly.fromCache && (
            <Text style={[styles.noticeText, styles.warnText]}>
              Cached totals may be incomplete. Reconnect to check the latest
              records and invoice payments.
            </Text>
          )}
          {!!report && report.pendingCount > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('WorkTracking')}
              style={[styles.card, styles.warnCard, styles.noticeRow]}>
              <MaterialCommunityIcons
                name="alert-outline"
                size={16}
                color={Colors.amberDarkText}
              />
              <Text style={[styles.noticeText, styles.warnText]}>
                {report.pendingCount}{' '}
                {report.pendingCount === 1 ? 'session needs' : 'sessions need'}{' '}
                review · est. {formatWorkDuration(report.pendingMs)} not counted
              </Text>
              <Text style={[styles.link, styles.warnText]}>Review</Text>
            </TouchableOpacity>
          )}
          {!!report?.overdue && (
            <Text style={[styles.noticeText, styles.warnText]}>
              A timer reached its stop deadline. Its time is shown as a pending
              estimate until reviewed.
            </Text>
          )}
          {!!report?.invalidRecordCount && (
            <Text style={[styles.noticeText, styles.warnText]}>
              Some work records could not be calculated. These totals exclude
              those records.
            </Text>
          )}

          {!!report && (
            <View>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{listTitle}</Text>
                <Text style={styles.listTotal}>
                  {formatWorkDuration(shownMs)}
                </Text>
              </View>

              {records.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.empty}>
                    {day === null
                      ? 'No work recorded this month.'
                      : 'No work recorded on this day.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.listCard}>
                  {records.slice(0, shown).map((item, index) => {
                    const zone = item.session.reportingTimeZone;
                    const range = `${clock(item.session.startedAt, zone)} – ${
                      item.session.endedAt === null
                        ? 'now'
                        : clock(item.session.endedAt, zone)
                    }`;
                    const earned = recordEarned(item);
                    return (
                      <TouchableOpacity
                        key={item.session.id}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate('WorkSessionDetails', {
                            sessionId: item.session.id,
                          })
                        }
                        style={[styles.row, index > 0 && styles.rowDivider]}>
                        <View
                          style={[
                            styles.dot,
                            {backgroundColor: dotColor(item)},
                          ]}
                        />
                        <View style={styles.rowText}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {workSessionTitle(item.session)}
                          </Text>
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {day === null
                              ? `${dayMonth(item.session.startedAt, zone)} · ${range}`
                              : range}
                          </Text>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={styles.rowTime}>
                            {formatWorkDuration(workedMs(item))}
                          </Text>
                          <Text style={styles.rowMoney}>
                            {earned !== null
                              ? workCurrency(earned)
                              : item.pendingMs > 0
                              ? 'Needs review'
                              : item.runningMs > 0
                              ? 'Running'
                              : '—'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {shown < records.length && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShown(value => value + PAGE)}
                  style={styles.linkButton}>
                  <Text style={styles.link}>Show more sessions</Text>
                </TouchableOpacity>
              )}
              {day !== null && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setDay(null)}
                  style={styles.linkButton}>
                  <Text style={styles.link}>Show the whole month</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
      <DatePicker
        modal
        mode="date"
        open={picker}
        date={new Date(selected.year, selected.month, 1, 12)}
        minimumDate={new Date(1970, 0, 1)}
        maximumDate={new Date(9998, 11, 31)}
        onCancel={() => setPicker(false)}
        onConfirm={date => {
          setSelected({year: date.getFullYear(), month: date.getMonth()});
          setPicker(false);
        }}
      />
    </WorkRecordLayout>
  );
};
export default WorkHours;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8F0FE',
    borderRadius: 12,
    padding: 14,
  },
  warnCard: {backgroundColor: '#FFFBEB', borderColor: '#FDE68A'},
  noticeRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  noticeText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
  },
  warnText: {color: '#92400E'},
  empty: {fontFamily: Fonts.fontRegular, fontSize: 13, color: '#64748B'},
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listTitle: {fontFamily: Fonts.semiBold, fontSize: 15, color: '#404F65'},
  listTotal: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: '#404F65',
    fontVariant: ['tabular-nums'],
  },
  listCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8F0FE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  rowDivider: {borderTopWidth: 1, borderTopColor: '#F1F5F9'},
  dot: {width: 7, height: 7, borderRadius: 4},
  rowText: {flex: 1, minWidth: 0},
  rowTitle: {fontFamily: Fonts.fontMedium, fontSize: 13.5, color: '#404F65'},
  rowSub: {fontFamily: Fonts.fontRegular, fontSize: 11.5, color: '#64748B'},
  rowRight: {alignItems: 'flex-end'},
  rowTime: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: '#404F65',
    fontVariant: ['tabular-nums'],
  },
  rowMoney: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  link: {fontFamily: Fonts.semiBold, fontSize: 13, color: '#407BFF'},
});
