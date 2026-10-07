import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {Colors, Fonts} from '../../constants/Themes';
import type {WorkSession, WorkSessionConfig} from '../../types/workSession';
import {formatWorkTime} from '../../utils/workSessionFlow';
import {WorkTimeFields} from './WorkTimeFields';
import {
  workIntervalError,
  workStopExplanation,
} from '../../utils/workSessionEntry';

export type WorkDialogState =
  | {
      kind: 'start';
      jobId?: string;
      existingSessionId?: string;
      hardCapAt?: number;
      title: string;
      reportingTimeZone: string;
      expectedEndAt: number | null;
      config: WorkSessionConfig;
    }
  | {kind: 'finish' | 'checkIn'; session: WorkSession; editing?: boolean};
type Save = {
  startedAt?: number;
  endedAt?: number;
  plannedFinishAt?: number;
  reportingTimeZone?: string;
  discard?: boolean;
  note?: string;
};

export const WorkSessionDialog = ({
  state,
  busy,
  pending,
  error,
  onClose,
  onContinue,
  onFinish,
  onSave,
  onRetry,
}: {
  state: WorkDialogState | null;
  busy: boolean;
  pending: boolean;
  error: string;
  onClose(): void;
  onContinue(): void;
  onFinish(): void;
  onSave(input: Save): Promise<void>;
  onRetry(): void;
}) => {
  const [startedAt, setStartedAt] = useState(Date.now());
  const [endedAt, setEndedAt] = useState(Date.now());
  const [planned, setPlanned] = useState(false);
  const [zone, setZone] = useState('UTC');
  const [picker, setPicker] = useState<'start' | 'finish' | null>(null);
  const [validation, setValidation] = useState('');
  const [discard, setDiscard] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    setValidation('');
    setDiscard(false);
    setPicker(null);
    if (!state) {
      return;
    }
    if (state.kind === 'start') {
      setZone(state.reportingTimeZone);
      setPlanned(
        !!state.existingSessionId ||
          (state.expectedEndAt !== null &&
            state.expectedEndAt + state.config.graceHours * 3600000 <=
              Date.now()),
      );
      setEndedAt(Math.min(Date.now() + 3600000, state.hardCapAt || Infinity));
    } else {
      setNote(state.editing ? '' : state.session.note || '');
      setStartedAt(state.session.startedAt);
      setEndedAt(
        state.session.endedAt ?? Math.min(Date.now(), state.session.autoStopAt),
      );
    }
  }, [state]);
  if (!state) {
    return null;
  }
  const requiredPlan =
    state.kind === 'start' &&
    state.expectedEndAt !== null &&
    state.expectedEndAt + state.config.graceHours * 3600000 <= Date.now();
  const choose = (field: 'start' | 'finish') => (
    <TouchableOpacity
      style={styles.field}
      disabled={busy || pending}
      onPress={() => setPicker(field)}
      accessibilityRole="button">
      <Text style={styles.label}>
        {field === 'start'
          ? 'Started'
          : state.kind === 'start'
          ? 'Planned finish'
          : 'Actual finish'}
      </Text>
      <Text style={styles.text}>
        {new Date(field === 'start' ? startedAt : endedAt).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
  const save = async () => {
    setValidation('');
    if (state.kind === 'start') {
      try {
        new Intl.DateTimeFormat('en-US', {timeZone: zone}).format();
      } catch {
        setValidation('Enter a valid reporting timezone.');
        return;
      }
      if (
        (planned || requiredPlan) &&
        (endedAt <= Date.now() ||
          endedAt >
            (state.hardCapAt ||
              Date.now() + state.config.hardCapHours * 3600000))
      ) {
        setValidation(
          `Planned finish must be in the next ${state.config.hardCapHours} hours.`,
        );
        return;
      }
      await onSave({
        reportingTimeZone: zone,
        ...(planned || requiredPlan ? {plannedFinishAt: endedAt} : {}),
      });
    } else {
      const intervalError = workIntervalError(
        {startedAt, endedAt, note},
        state.session.timingConfig,
        Date.now(),
      );
      if (!discard && intervalError) {
        setValidation(intervalError);
        return;
      }
      if (state.editing && !discard && !note.trim()) {
        setValidation('Add a short reason for this correction.');
        return;
      }
      await onSave({startedAt, endedAt, discard, note: note.trim()});
    }
  };
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => {
        if (!busy) {
          onClose();
        }
      }}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>
              {state.kind === 'start'
                ? state.existingSessionId
                  ? 'Plan your finish'
                  : 'Start work'
                : state.kind === 'checkIn'
                ? 'Still working?'
                : state.editing
                ? 'Correct this work record'
                : 'Confirm your work time'}
            </Text>
            <Text style={styles.text}>
              {state.kind === 'start'
                ? state.title
                : state.session.jobSnapshot?.title || 'General work'}
            </Text>
            {state.kind === 'checkIn' ? (
              <>
                <Text style={styles.help}>
                  The expected finish has arrived. Continuing keeps the original
                  stop deadline.
                </Text>
                <Text style={styles.help}>
                  Timer stops by{' '}
                  {formatWorkTime(
                    state.session.autoStopAt,
                    state.session.reportingTimeZone,
                  )}
                  .
                </Text>
                <TouchableOpacity style={styles.primary} onPress={onContinue}>
                  <Text style={styles.white}>Yes, still working</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondary} onPress={onFinish}>
                  <Text style={styles.text}>No, choose when I finished</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {state.kind === 'start' ? (
                  <>
                    <Text style={styles.label}>
                      Reporting timezone (saved for future sessions)
                    </Text>
                    <TextInput
                      value={zone}
                      onChangeText={setZone}
                      editable={!busy && !pending && !state.existingSessionId}
                      autoCapitalize="none"
                      style={styles.field}
                      accessibilityLabel="Reporting timezone"
                    />
                    {state.expectedEndAt !== null && (
                      <Text style={styles.help}>
                        Expected finish:{' '}
                        {formatWorkTime(
                          state.expectedEndAt,
                          state.reportingTimeZone,
                        )}
                      </Text>
                    )}
                    {requiredPlan && (
                      <Text style={styles.warning}>
                        The original stop deadline has passed. Choose a revised
                        planned finish to start.
                      </Text>
                    )}
                    {(state.expectedEndAt === null || requiredPlan) && (
                      <>
                        {!requiredPlan && !state.existingSessionId && (
                          <TouchableOpacity
                            style={styles.secondary}
                            onPress={() => setPlanned(!planned)}
                            disabled={busy || pending}>
                            <Text style={styles.text}>
                              {planned
                                ? 'Remove planned finish'
                                : 'Add an optional planned finish'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {(planned || requiredPlan) && choose('finish')}
                      </>
                    )}
                    <Text style={styles.help}>
                      Only hours are tracked. Your job price and invoices stay
                      the same.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.help}>
                      {state.editing
                        ? 'The saved times will be replaced and the previous times kept in history.'
                        : state.session.source === 'manualCleaner'
                        ? 'This manual record is pending. Confirm the actual times to count its hours.'
                        : workStopExplanation(state.session.stopReason)}
                    </Text>
                    {!discard && (
                      <WorkTimeFields
                        value={{startedAt, endedAt, note}}
                        disabled={busy || pending}
                        reportingTimeZone={state.session.reportingTimeZone}
                        session={state.session}
                        noteLabel={
                          state.editing
                            ? 'Reason for correction (required)'
                            : 'Note (optional)'
                        }
                        onChange={value => {
                          setStartedAt(value.startedAt);
                          setEndedAt(value.endedAt);
                          setNote(value.note);
                        }}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.secondary}
                      disabled={busy || pending}
                      onPress={() => setDiscard(!discard)}>
                      <Text style={styles.warning}>
                        {discard
                          ? 'Keep this record and enter times'
                          : 'Discard this record instead'}
                      </Text>
                    </TouchableOpacity>
                    {discard && (
                      <Text style={styles.warning}>
                        This will exclude all hours from this record. Its
                        history is retained.
                      </Text>
                    )}
                  </>
                )}
                {!!(validation || error) && (
                  <Text accessibilityRole="alert" style={styles.warning}>
                    {validation || error}
                  </Text>
                )}
                {pending ? (
                  <TouchableOpacity
                    style={styles.primary}
                    disabled={busy}
                    onPress={onRetry}>
                    <Text style={styles.white}>Retry unfinished save</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primary}
                    disabled={busy}
                    onPress={save}>
                    {busy ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.white}>
                        {state.kind === 'start'
                          ? state.existingSessionId
                            ? 'Save planned finish'
                            : 'Clock in'
                          : discard
                          ? 'Discard record'
                          : state.editing
                          ? 'Save corrected times'
                          : 'Confirm these times'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.secondary}
              disabled={busy}
              onPress={onClose}>
              <Text style={styles.help}>Not now</Text>
            </TouchableOpacity>
          </ScrollView>
          <DatePicker
            modal
            open={picker !== null}
            mode="datetime"
            date={new Date(picker === 'start' ? startedAt : endedAt)}
            maximumDate={state.kind === 'start' ? undefined : new Date()}
            onConfirm={date => {
              if (picker === 'start') {
                setStartedAt(date.getTime());
              } else {
                setEndedAt(date.getTime());
              }
              setPicker(null);
            }}
            onCancel={() => setPicker(null)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {backgroundColor: Colors.white, borderRadius: 20, maxHeight: '90%'},
  content: {padding: 22, gap: 12},
  title: {fontFamily: Fonts.fontBold, fontSize: 23, color: Colors.slateText},
  text: {fontFamily: Fonts.fontMedium, fontSize: 16, color: Colors.slateText},
  help: {
    fontFamily: Fonts.fontRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.secondaryText,
  },
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: 13,
    color: Colors.secondaryText,
  },
  field: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    color: Colors.slateText,
    gap: 6,
  },
  primary: {
    backgroundColor: Colors.gradient1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  white: {color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 16},
  secondary: {padding: 12, alignItems: 'center'},
  warning: {color: Colors.amberDarkText, fontSize: 14, lineHeight: 21},
});
