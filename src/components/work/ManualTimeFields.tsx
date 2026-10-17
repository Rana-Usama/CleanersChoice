import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {formatWorkDuration} from '../../utils/workSessionFlow';
import {cachedDateFormatter} from '../../utils/intlCache';
import type {WorkTimeValues} from './WorkTimeFields';

const DAY_MS = 24 * 60 * 60 * 1000;
const dayStart = (time: number) => {
  const day = new Date(time);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};
/** Whole calendar days between two times; rounding absorbs DST hours. */
const daysBetween = (from: number, to: number) =>
  Math.round((dayStart(to) - dayStart(from)) / DAY_MS);
const clock = (time: number) =>
  cachedDateFormatter('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(time));
const dayLabel = (time: number) =>
  cachedDateFormatter('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(time));

type Picker = 'date' | 'start' | 'finish' | null;

/**
 * The quick form's date and times: Today / Yesterday / any allowed day, then
 * start → finish with the duration between them. Moving the day keeps the
 * times and the length; a finish earlier than the start means overnight.
 */
export const ManualTimeFields = ({
  value,
  onChange,
  disabled = false,
  now,
  maxAgeDays,
}: {
  value: WorkTimeValues;
  onChange(value: WorkTimeValues): void;
  disabled?: boolean;
  now: number;
  maxAgeDays: number;
}) => {
  const [picker, setPicker] = useState<Picker>(null);
  const offset = daysBetween(value.startedAt, now);
  const length = value.endedAt - value.startedAt;
  const overnight = daysBetween(value.startedAt, value.endedAt);

  const moveTo = (day: number) => {
    const start = new Date(value.startedAt);
    const target = new Date(day);
    start.setFullYear(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    );
    onChange({
      ...value,
      startedAt: start.getTime(),
      endedAt: start.getTime() + Math.max(length, 0),
    });
  };
  const setStart = (picked: Date) => {
    const start = new Date(value.startedAt);
    start.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    const startedAt = start.getTime();
    onChange({
      ...value,
      startedAt,
      // Keep the finish where it was unless the new start passes it.
      endedAt:
        value.endedAt > startedAt
          ? value.endedAt
          : startedAt + Math.max(length, 0),
    });
  };
  const setFinish = (picked: Date) => {
    const finish = new Date(value.startedAt);
    finish.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    if (finish.getTime() <= value.startedAt) {
      finish.setDate(finish.getDate() + 1);
    }
    onChange({...value, endedAt: finish.getTime()});
  };

  const dates = [
    {key: 'today', label: 'Today', on: offset === 0, press: () => moveTo(now)},
    {
      key: 'yesterday',
      label: 'Yesterday',
      on: offset === 1,
      press: () => moveTo(now - DAY_MS),
    },
    {
      key: 'pick',
      label: offset >= 2 ? dayLabel(value.startedAt) : 'Pick a day',
      on: offset >= 2,
      press: () => setPicker('date'),
    },
  ];
  const tile = (field: 'start' | 'finish') => {
    const time = field === 'start' ? value.startedAt : value.endedAt;
    const label = field === 'start' ? 'Start' : 'Finish';
    const nextDay = field === 'finish' && overnight > 0;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${clock(time)}${
          nextDay ? ', next day' : ''
        }`}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => setPicker(field)}
        style={styles.tile}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue} numberOfLines={1}>
          {clock(time)}
          {nextDay && <Text style={styles.nextDay}> +{overnight}</Text>}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.group}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.dateRow}>
          {dates.map(date => (
            <TouchableOpacity
              key={date.key}
              accessibilityRole="button"
              accessibilityState={{selected: date.on, disabled}}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={date.press}
              style={[styles.dateChip, date.on && styles.dateChipOn]}>
              <Text
                numberOfLines={1}
                style={[styles.dateText, date.on && styles.dateTextOn]}>
                {date.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <View style={styles.timeHeader}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              {length > 0 ? formatWorkDuration(length) : '—'}
            </Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          {tile('start')}
          <View style={styles.between}>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={Colors.gray400}
            />
          </View>
          {tile('finish')}
        </View>
      </View>

      <DatePicker
        modal
        mode={picker === 'date' ? 'date' : 'time'}
        open={picker !== null}
        date={new Date(picker === 'finish' ? value.endedAt : value.startedAt)}
        {...(picker === 'date'
          ? {
              maximumDate: new Date(now),
              minimumDate: new Date(dayStart(now - maxAgeDays * DAY_MS)),
            }
          : {})}
        onCancel={() => setPicker(null)}
        onConfirm={picked => {
          if (!disabled) {
            if (picker === 'date') {
              moveTo(picked.getTime());
            } else if (picker === 'start') {
              setStart(picked);
            } else if (picker === 'finish') {
              setFinish(picked);
            }
          }
          setPicker(null);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  group: {gap: 6},
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  dateRow: {flexDirection: 'row', gap: 8},
  dateChip: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipOn: {
    borderColor: Colors.gradient1,
    backgroundColor: Colors.blueBg200,
  },
  dateText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: Colors.slateText,
  },
  dateTextOn: {color: Colors.gradient1},
  timeRow: {flexDirection: 'row', alignItems: 'stretch', gap: 8},
  tile: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tileLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: 11.5,
    color: Colors.secondaryText,
  },
  tileValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.slateText,
    fontVariant: ['tabular-nums'],
  },
  nextDay: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
    color: Colors.gradient1,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Only the arrow sits between the tiles, so it centres on their height.
  between: {
    width: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A View carries the fill: a styled Text can drop its background on iOS.
  pill: {
    backgroundColor: Colors.blueBg200,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.gradient1,
    fontVariant: ['tabular-nums'],
  },
});
