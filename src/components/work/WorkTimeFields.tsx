import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {Colors, Fonts} from '../../constants/Themes';
import type {WorkSession} from '../../types/workSession';
import {formatWorkDuration} from '../../utils/workSessionFlow';
import {detailedWorkTime, quickWorkTimes} from '../../utils/workSessionEntry';
import {cachedDateFormatter} from '../../utils/intlCache';
import {workStyles} from './workTheme';

/** The month a chosen interval's hours would land in. */
const monthOf = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(time));

export type WorkTimeValues = {startedAt: number; endedAt: number; note: string};
export const WorkTimeFields = ({
  value,
  onChange,
  disabled = false,
  reportingTimeZone,
  session,
  noteLabel = 'Note (optional)',
}: {
  value: WorkTimeValues;
  onChange(value: WorkTimeValues): void;
  disabled?: boolean;
  reportingTimeZone: string;
  session?: WorkSession;
  noteLabel?: string;
}) => {
  const [picker, setPicker] = useState<'start' | 'finish' | null>(null);
  return (
    <View style={styles.form}>
      <Text style={styles.help}>
        Choose the start and finish dates and times. For overnight work, select
        the next day as the finish date.
      </Text>
      {session?.status === 'needsReview' && session.source === 'clock' && (
        <View style={styles.quickRow}>
          {[4, 6, 8].map(hours => {
            const times = quickWorkTimes(session, hours, Date.now());
            // Highlight whichever quick pick the current values already match,
            // so the chosen duration stays visible after tapping.
            const chosen =
              !!times &&
              times.startedAt === value.startedAt &&
              times.endedAt === value.endedAt;
            return (
              <TouchableOpacity
                key={hours}
                accessibilityRole="button"
                accessibilityState={{selected: chosen, disabled: !times}}
                disabled={disabled || !times}
                style={[
                  workStyles.chip,
                  chosen && workStyles.chipActive,
                  !times && styles.unavailable,
                ]}
                onPress={() => {
                  if (times) {
                    onChange({...value, ...times});
                  }
                }}>
                <Text
                  style={[
                    workStyles.chipText,
                    chosen && workStyles.chipActiveText,
                  ]}>
                  {hours}h
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.help}>Or pick times below</Text>
        </View>
      )}
      {(['start', 'finish'] as const).map(field => (
        <TouchableOpacity
          key={field}
          style={styles.field}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => setPicker(field)}>
          <Text style={styles.label}>
            {field === 'start' ? 'Started' : 'Actual finish'}
          </Text>
          <Text style={styles.text}>
            {cachedDateFormatter('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }).format(
              new Date(field === 'start' ? value.startedAt : value.endedAt),
            )}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.preview}>
        <Text style={styles.title}>
          {formatWorkDuration(value.endedAt - value.startedAt)} selected
        </Text>
        <Text style={styles.help}>
          {detailedWorkTime(value.startedAt, reportingTimeZone)} →{' '}
          {detailedWorkTime(value.endedAt, reportingTimeZone)}
        </Text>
        {value.endedAt > value.startedAt && (
          <Text style={styles.consequence}>
            {monthOf(value.startedAt, reportingTimeZone) ===
            monthOf(value.endedAt - 1, reportingTimeZone)
              ? `Adds ${formatWorkDuration(
                  value.endedAt - value.startedAt,
                )} to ${monthOf(
                  value.startedAt,
                  reportingTimeZone,
                )} once confirmed.`
              : `These hours are split between ${monthOf(
                  value.startedAt,
                  reportingTimeZone,
                )} and ${monthOf(
                  value.endedAt - 1,
                  reportingTimeZone,
                )} once confirmed.`}
          </Text>
        )}
      </View>
      <Text style={styles.label}>{noteLabel}</Text>
      <TextInput
        value={value.note}
        onChangeText={note => onChange({...value, note})}
        editable={!disabled}
        maxLength={1000}
        multiline
        textAlignVertical="top"
        style={[styles.field, styles.note]}
        accessibilityLabel={noteLabel}
        placeholder="Add context for this work record"
        placeholderTextColor={Colors.secondaryText}
      />
      <DatePicker
        modal
        mode="datetime"
        open={picker !== null}
        date={new Date(picker === 'start' ? value.startedAt : value.endedAt)}
        maximumDate={new Date()}
        onCancel={() => setPicker(null)}
        onConfirm={date => {
          if (!disabled) {
            onChange({
              ...value,
              [picker === 'start' ? 'startedAt' : 'endedAt']: date.getTime(),
            });
          }
          setPicker(null);
        }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  form: {gap: 12},
  help: {fontFamily: Fonts.fontRegular, fontSize: 13, lineHeight: 20, color: Colors.secondaryText},
  title: {fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.slateText},
  text: {fontFamily: Fonts.fontMedium, color: Colors.slateText, fontSize: 15},
  label: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
  },
  field: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    padding: 14,
    gap: 6,
    color: Colors.slateText,
  },
  note: {fontFamily: Fonts.fontRegular, minHeight: 88},
  preview: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.blueBg50,
    gap: 6,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  unavailable: {opacity: 0.4},
  consequence: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.amberDarkText,
  },
});
