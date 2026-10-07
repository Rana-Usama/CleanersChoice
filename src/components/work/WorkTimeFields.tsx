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
import {
  deviceWorkTimeZone,
  formatWorkDuration,
} from '../../utils/workSessionFlow';
import {detailedWorkTime, quickWorkTimes} from '../../utils/workSessionEntry';

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
        Choose explicit dates and times, shown in {deviceWorkTimeZone()}. For
        overnight work, select the next day as the finish date.
      </Text>
      {session?.status === 'needsReview' && session.source === 'clock' && (
        <View style={styles.quickRow}>
          {[4, 6, 8].map(hours => {
            const times = quickWorkTimes(session, hours, Date.now());
            return (
              <TouchableOpacity
                key={hours}
                accessibilityRole="button"
                disabled={disabled || !times}
                style={[styles.quick, !times && styles.unavailable]}
                onPress={() => {
                  if (times) {
                    onChange({...value, ...times});
                  }
                }}>
                <Text style={styles.quickText}>{hours}h</Text>
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
            {new Date(
              field === 'start' ? value.startedAt : value.endedAt,
            ).toLocaleString()}
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
        <Text style={styles.help}>Reporting timezone: {reportingTimeZone}</Text>
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
  help: {fontSize: 13, lineHeight: 20, color: Colors.secondaryText},
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
  note: {minHeight: 88},
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
  quick: {padding: 12, borderRadius: 10, backgroundColor: Colors.blueBg50},
  quickText: {fontFamily: Fonts.semiBold, color: Colors.gradient1},
  unavailable: {opacity: 0.4},
});
