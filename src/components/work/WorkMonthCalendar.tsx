import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import type {WorkMonthlyReport} from '../../services/workMonthlyReport';
import {workCurrency} from '../../services/workMonthlyReport';
import {formatWorkDuration} from '../../utils/workSessionFlow';
import {cachedDateFormatter} from '../../utils/intlCache';
import type {WorkMonth} from '../../utils/workMonth';

/** Monday-first, to match how a working week is usually read. */
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Heat steps, light to dark. Lightness carries the value, not hue. */
const HEAT = ['#EFF6FF', '#BBD2FF', '#7BA3FF', '#407BFF'];
const EMPTY_FILL = '#F8FAFC';

const daysInMonth = ({year, month}: WorkMonth) =>
  new Date(year, month + 1, 0).getDate();

/** Blank cells before the 1st, with Monday as column 0. */
const leadingBlanks = ({year, month}: WorkMonth) =>
  (new Date(year, month, 1).getDay() + 6) % 7;

/**
 * The calendar day a session belongs to: the day it STARTED, in its own
 * reporting zone - the same rule the session list uses for its date.
 */
export const workDayOf = (time: number, timeZone: string): number =>
  Number(
    cachedDateFormatter('en-US', {timeZone, day: 'numeric'}).format(
      new Date(time),
    ),
  );

export type WorkDayTotals = {
  byDay: Record<number, number>;
  peak: number;
};

export const buildDayTotals = (
  report: WorkMonthlyReport | null,
): WorkDayTotals => {
  const byDay: Record<number, number> = {};
  let peak = 0;
  for (const record of report?.records ?? []) {
    const worked =
      record.confirmedMs || record.pendingMs || record.runningMs || 0;
    if (worked <= 0) {
      continue;
    }
    const day = workDayOf(
      record.session.startedAt,
      record.session.reportingTimeZone,
    );
    if (!Number.isFinite(day)) {
      continue;
    }
    byDay[day] = (byDay[day] || 0) + worked;
    peak = Math.max(peak, byDay[day]);
  }
  return {byDay, peak};
};

export const WorkMonthCalendar = ({
  month,
  monthLabel,
  report,
  totals,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPickMonth,
  prevDisabled,
  nextDisabled,
}: {
  month: WorkMonth;
  monthLabel: string;
  report: WorkMonthlyReport | null;
  totals: WorkDayTotals;
  selectedDay: number | null;
  onSelectDay(day: number | null): void;
  onPrevMonth(): void;
  onNextMonth(): void;
  onPickMonth(): void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) => {
  const cells = useMemo(() => {
    const out: (number | null)[] = [];
    for (let i = 0; i < leadingBlanks(month); i += 1) {
      out.push(null);
    }
    for (let day = 1; day <= daysInMonth(month); day += 1) {
      out.push(day);
    }
    return out;
  }, [month]);

  const step = (worked: number): number => {
    if (!worked || !totals.peak) {
      return -1;
    }
    const ratio = worked / totals.peak;
    return ratio > 0.75 ? 3 : ratio > 0.45 ? 2 : ratio > 0.2 ? 1 : 0;
  };

  return (
    <View style={styles.card}>
      <View style={styles.monthRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Previous"
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          style={[styles.stepper, prevDisabled && styles.dim]}
          disabled={prevDisabled}
          onPress={onPrevMonth}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={Colors.gradient1}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Choose report month"
          activeOpacity={0.7}
          onPress={onPickMonth}>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Next"
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          style={[styles.stepper, nextDisabled && styles.dim]}
          disabled={nextDisabled}
          onPress={onNextMonth}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={Colors.gradient1}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((label, index) => (
          <View key={`wd-${index}`} style={styles.weekdayCell}>
            <Text style={styles.weekday}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const worked = totals.byDay[day] || 0;
          const level = step(worked);
          const selected = selectedDay === day;
          return (
            <View key={`day-${day}`} style={styles.cell}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{selected}}
                accessibilityLabel={
                  worked
                    ? `${day} ${monthLabel}, ${formatWorkDuration(worked)}`
                    : `${day} ${monthLabel}, no work`
                }
                activeOpacity={0.75}
                onPress={() => onSelectDay(selected ? null : day)}
                style={[
                  styles.dayBox,
                  {backgroundColor: level < 0 ? EMPTY_FILL : HEAT[level]},
                  selected && styles.dayBoxSelected,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    level >= 0 && styles.dayTextWorked,
                    // Only the two darkest steps are dark enough for white.
                    level >= 2 && styles.dayTextOnDark,
                  ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.legend}>Less</Text>
        {HEAT.map(tone => (
          <View key={tone} style={[styles.swatch, {backgroundColor: tone}]} />
        ))}
        <Text style={styles.legend}>More</Text>
        <View style={styles.spacer} />
        {!!report && (
          <Text style={styles.total}>
            {formatWorkDuration(report.confirmedMs)} ·{' '}
            {workCurrency(report.earned)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8F0FE',
    borderRadius: 14,
    padding: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  dim: {opacity: 0.4},
  monthTitle: {
    minWidth: 124,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#404F65',
  },
  // Seven columns; the 2px padding on every cell makes the 4px gap.
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2},
  weekdayCell: {width: '14.2857%', paddingHorizontal: 2, paddingBottom: 6},
  weekday: {
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  cell: {width: '14.2857%', height: 38, padding: 2},
  dayBox: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayBoxSelected: {borderWidth: 2, borderColor: '#404F65'},
  dayText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    color: '#9CA3AF',
  },
  dayTextWorked: {fontFamily: Fonts.semiBold, color: '#404F65'},
  dayTextOnDark: {color: Colors.white},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legend: {fontFamily: Fonts.fontRegular, fontSize: 11.5, color: '#64748B'},
  swatch: {width: 15, height: 15, borderRadius: 4},
  spacer: {flex: 1},
  total: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
    color: '#404F65',
    fontVariant: ['tabular-nums'],
  },
});
