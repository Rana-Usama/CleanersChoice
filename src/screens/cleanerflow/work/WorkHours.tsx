import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {
  workSessionTone,
  workStyles as styles,
  workToneStyle,
} from '../../../components/work/workTheme';
import {
  WorkButton,
  WorkCollapsible,
  WorkIconTile,
  WorkSectionHeader,
} from '../../../components/work/WorkUI';
import {WorkMonthSummary} from '../../../components/work/WorkMonthSummary';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {useWorkMonthlyReport} from '../../../hooks/useWorkMonthlyReport';
import {getMonthLabel} from '../../../services/earningsService';
import {workCurrency} from '../../../services/workMonthlyReport';
import {Colors} from '../../../constants/Themes';
import {cachedDateFormatter} from '../../../utils/intlCache';
import {
  formatWorkDuration,
  formatWorkTime,
  workSessionTitle,
} from '../../../utils/workSessionFlow';
import {workStatusLabel} from '../../../utils/workSessionEntry';
import {shiftWorkMonth, WorkMonth} from '../../../utils/workMonth';

const PAGE = 25;
type Filter = 'all' | 'confirmed' | 'needsReview';

/** "Tue 8 Sep", in the record's own reporting zone. */
const shortDay = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(time));

/** How a job's money was agreed, for the by-job line. */
const basisLabel = (basis?: string) =>
  basis === 'hourly'
    ? 'hourly'
    : basis === 'sqft'
    ? 'per sq ft'
    : basis === 'flat'
    ? 'flat'
    : '';

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
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [shownJobs, setShownJobs] = useState(PAGE);
  const report = monthly.report;
  useEffect(() => {
    setShown(PAGE);
    setShownJobs(PAGE);
  }, [selected.year, selected.month, filter, work.uid]);

  const records =
    report?.records.filter(
      item =>
        filter === 'all' ||
        (filter === 'confirmed' ? item.confirmedMs > 0 : item.pendingMs > 0),
    ) || [];

  const monthLabel = `${getMonthLabel(selected.month)} ${selected.year}`;

  return (
    <WorkRecordLayout
      title="Work Hours"
      onBack={() => navigation.goBack()}
      actionIcon="calendar-month-outline"
      actionLabel="Choose report month"
      onAction={() => setPicker(true)}>
      {!monthly.available ? (
        <View style={[styles.card, styles.pullUp]}>
          <Text style={styles.help}>
            Monthly tracking is available to eligible cleaners when tracking is
            enabled or existing work history is available.
          </Text>
        </View>
      ) : (
        <>
          <WorkMonthSummary
            {...monthly}
            onRetry={monthly.retry}
            monthLabel={monthLabel}
            onPickMonth={() => setPicker(true)}
          />

          {/* Month stepping stays available; the wireframe's single pill
              covers choosing, not nudging one month either way. */}
          <View style={[styles.card, styles.monthSelector, styles.monthBar]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Previous"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.stepper}
              disabled={selected.year === 1970 && selected.month === 0}
              onPress={() => setSelected(value => shiftWorkMonth(value, -1))}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
            <Text style={styles.sml}>{monthLabel}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Next"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.stepper}
              disabled={selected.year === 9998 && selected.month === 11}
              onPress={() => setSelected(value => shiftWorkMonth(value, 1))}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
          </View>

          {report && (
            <>
              {/* ---- needs review ------------------------------------ */}
              {report.pendingCount > 0 && (
                <View style={[styles.card, styles.warnCard, styles.detailRow]}>
                  <WorkIconTile
                    icon="alert-outline"
                    color={Colors.amberDarkText}
                    bg={Colors.amberOverlay20}
                  />
                  <View style={styles.detailPrimary}>
                    <Text style={[styles.body, {color: Colors.amberDarkText}]}>
                      {report.pendingCount}{' '}
                      {report.pendingCount === 1 ? 'session' : 'sessions'} need
                      review
                    </Text>
                    <Text style={[styles.sml, {color: Colors.amberDarkText}]}>
                      Est. {formatWorkDuration(report.pendingMs)} not counted
                      yet
                    </Text>
                  </View>
                  <WorkButton
                    variant="warn"
                    label="Review"
                    onPress={() => navigation.navigate('WorkTracking')}
                    style={styles.inlineAction}
                  />
                </View>
              )}

              {/* ---- by job ------------------------------------------ */}
              <WorkSectionHeader title="By job" hint="Earned" />
              {report.jobs.length === 0 ? (
                <Text style={styles.help}>
                  No work or completed jobs for this month.
                </Text>
              ) : (
                <View style={[styles.card, styles.cardFlush]}>
                  {report.jobs.slice(0, shownJobs).map((job, index) => {
                    const basis = basisLabel(
                      report.records.find(
                        item => item.session.jobId === job.jobId,
                      )?.session.paySnapshot?.basis,
                    );
                    return (
                      <View key={job.key}>
                        {index > 0 && <View style={styles.divider} />}
                        <View style={[styles.cardRow, styles.detailRow]}>
                          <View style={styles.detailPrimary}>
                            <Text style={styles.body}>{job.title}</Text>
                            <Text style={styles.sml}>
                              {formatWorkDuration(job.confirmedMs)}
                              {basis ? ` · ${basis}` : ''}
                            </Text>
                            {job.pendingMs > 0 && (
                              <Text style={styles.sml}>
                                +{formatWorkDuration(job.pendingMs)} pending
                              </Text>
                            )}
                            {job.unratedMs > 0 && (
                              <Text style={styles.sml}>
                                {formatWorkDuration(job.unratedMs)} unrated
                              </Text>
                            )}
                          </View>
                          <View style={styles.metricColumn}>
                            <Text style={[styles.body, styles.mono]}>
                              {workCurrency(job.earned)}
                            </Text>
                            <Text style={styles.sml}>earned</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              {shownJobs < report.jobs.length && (
                <WorkButton
                  variant="ghost"
                  icon="chevron-down"
                  label="Show more jobs"
                  onPress={() => setShownJobs(value => value + PAGE)}
                />
              )}

              {/* ---- sessions ---------------------------------------- */}
              <WorkSectionHeader
                title="Sessions"
                actionLabel={work.manualAvailable ? '+ Add record' : undefined}
                onAction={
                  work.manualAvailable
                    ? () => navigation.navigate('ManualWorkEntry')
                    : undefined
                }
              />
              <View style={styles.filters}>
                {(['all', 'confirmed', 'needsReview'] as Filter[]).map(
                  value => (
                    <TouchableOpacity
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{selected: filter === value}}
                      style={[
                        styles.chip,
                        filter === value && styles.chipSelected,
                      ]}
                      onPress={() => setFilter(value)}>
                      <Text
                        style={[
                          styles.chipText,
                          filter === value && {color: Colors.gradient1},
                        ]}>
                        {value === 'all'
                          ? 'All'
                          : value === 'confirmed'
                          ? 'Confirmed'
                          : 'Pending'}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
              {records.length === 0 ? (
                <Text style={styles.help}>
                  No{' '}
                  {filter === 'all'
                    ? 'work'
                    : filter === 'confirmed'
                    ? 'confirmed'
                    : 'pending'}{' '}
                  records for this month.
                </Text>
              ) : (
                <View style={[styles.card, styles.cardFlush]}>
                  {records.slice(0, shown).map((item, index) => {
                    const tone = workSessionTone(item.session);
                    const t = workToneStyle(tone);
                    const zone = item.session.reportingTimeZone;
                    const pending = item.pendingMs > 0;
                    return (
                      <View key={item.session.id}>
                        {index > 0 && <View style={styles.divider} />}
                        <TouchableOpacity
                          accessibilityRole="button"
                          activeOpacity={0.75}
                          style={[
                            styles.cardRow,
                            styles.detailRow,
                            pending && styles.rowWarn,
                            tone === 'discarded' && styles.rowMuted,
                          ]}
                          onPress={() =>
                            navigation.navigate('WorkSessionDetails', {
                              sessionId: item.session.id,
                            })
                          }>
                          <WorkIconTile
                            icon={t.icon}
                            color={t.fg}
                            bg={t.bg}
                            size={12}
                            outerSize={{width: 22, height: 22}}
                          />
                          <View style={styles.detailPrimary}>
                            {/* Date-led, as wireframed: the day is how a
                                cleaner finds a session, not the job name. */}
                            <Text style={styles.body}>
                              {shortDay(item.session.startedAt, zone)} ·{' '}
                              {workSessionTitle(item.session)}
                            </Text>
                            {/* <Text style={styles.sml}>
                              {formatWorkTime(item.session.startedAt, zone)}
                              {item.session.endedAt === null
                                ? ' – open'
                                : ` – ${formatWorkTime(
                                    item.session.endedAt,
                                    zone,
                                  )}`}
                              {item.crossesMonth ? ' · split' : ''}
                            </Text> */}
                          </View>
                          <View style={styles.metricColumn}>
                            <Text style={[styles.body, styles.mono]}>
                              {pending ? 'est. ' : ''}
                              {formatWorkDuration(
                                item.confirmedMs ||
                                  item.pendingMs ||
                                  item.runningMs,
                              )}
                            </Text>
                            <Text style={[styles.sml, {color: t.fg}]}>
                              {pending
                                ? 'Needs review'
                                : workStatusLabel(item.session.status)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
              {shown < records.length && (
                <WorkButton
                  variant="ghost"
                  icon="chevron-down"
                  label="Show more work records"
                  onPress={() => setShown(value => value + PAGE)}
                />
              )}

              <WorkCollapsible title="How these numbers work">
                <Text style={styles.sml}>
                  <Text style={styles.body}>Earned</Text> is hourly time at the
                  rate saved when you clocked in, plus fixed-price jobs
                  completed this month. A fixed price is never divided across
                  its sessions. General-work totals count once in the finish
                  month after their hours are confirmed.
                </Text>
                <Text style={styles.sml}>
                  <Text style={styles.body}>Pending hours</Text> are not counted
                  anywhere until you confirm the actual times.
                </Text>
                <Text style={styles.sml}>
                  Overnight hours are split between months. Totals use exact
                  elapsed time; displayed hours use whole minutes.
                </Text>
              </WorkCollapsible>
            </>
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
