import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import {Colors, Fonts} from '../../constants/Themes';
import type {WorkSession, WorkSessionConfig} from '../../types/workSession';
import {
  deviceWorkTimeZone,
  formatWorkTime,
  formatWorkTimer,
  workSessionTitle,
} from '../../utils/workSessionFlow';
import {cachedDateFormatter, isValidTimeZone} from '../../utils/intlCache';
import {WorkTimeFields} from './WorkTimeFields';
import {workStyles} from './workTheme';
import {WorkButton, WorkIconTile} from './WorkUI';
import {GeneralWorkEarningsDialog} from './GeneralWorkEarningsDialog';
import {GeneralWorkEarningsField} from './GeneralWorkEarningsField';
import {
  parseWorkEarnings,
  workEarningsError,
} from '../../utils/workGeneralEarnings';
import {useWorkTicker} from '../../hooks/useWorkTicker';
import {
  workIntervalError,
  workStopExplanation,
} from '../../utils/workSessionEntry';

export type WorkDialogState =
  | {
      kind: 'start';
      jobId?: string;
      existingSessionId?: string;
      actualStartedAt?: number;
      hardCapAt?: number;
      title: string;
      reportingTimeZone: string;
      expectedEndAt: number | null;
      config: WorkSessionConfig;
    }
  | {
      kind: 'finish' | 'checkIn' | 'earnings';
      session: WorkSession;
      editing?: boolean;
      initialDiscard?: boolean;
    };
type Save = {
  workName?: string;
  expectedEarnings?: number;
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
  const insets = useSafeAreaInsets();
  const {fontScale, width} = useWindowDimensions();
  const [startedAt, setStartedAt] = useState(Date.now());
  const [endedAt, setEndedAt] = useState(Date.now());
  const [planned, setPlanned] = useState(false);
  const [zone, setZone] = useState('UTC');
  const [workName, setWorkName] = useState('');
  const [expectedEarnings, setExpectedEarnings] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [picker, setPicker] = useState<'start' | 'finish' | null>(null);
  const [validation, setValidation] = useState('');
  const [discard, setDiscard] = useState(false);
  const [note, setNote] = useState('');
  const tick = useWorkTicker(state?.kind === 'checkIn');
  useEffect(() => {
    setValidation('');
    setExpectedEarnings('');
    setDiscard(state?.kind === 'finish' && !!state.initialDiscard);
    setPicker(null);
    setNameFocused(false);
    if (!state) {
      return;
    }
    if (state.kind === 'start') {
      setZone(
        isValidTimeZone(state.reportingTimeZone)
          ? state.reportingTimeZone.trim()
          : deviceWorkTimeZone(),
      );
      setWorkName(state.jobId || state.existingSessionId ? state.title : '');
      setStartedAt(state.actualStartedAt ?? Date.now());
      setPlanned(
        state.expectedEndAt === null ||
          !!state.existingSessionId ||
          (state.expectedEndAt !== null &&
            state.expectedEndAt + state.config.graceHours * 3600000 <=
              Date.now()),
      );
      setEndedAt(
        Math.min(
          Date.now() + 3600000,
          state.hardCapAt || Date.now() + state.config.hardCapHours * 3600000,
        ),
      );
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
  if (state.kind === 'earnings') {
    return (
      <GeneralWorkEarningsDialog
        key={state.session.id + ':' + (state.session.revision ?? 0)}
        session={state.session}
        busy={busy}
        pending={pending}
        error={error}
        onClose={onClose}
        onRetry={onRetry}
        onSave={onSave}
      />
    );
  }
  const requiredPlan =
    state.kind === 'start' &&
    state.expectedEndAt !== null &&
    state.expectedEndAt + state.config.graceHours * 3600000 <= Date.now();
  const canChooseEnd =
    state.kind === 'start' && (state.expectedEndAt === null || requiredPlan);
  const displayStart =
    state.kind === 'start' ? state.actualStartedAt ?? startedAt : startedAt;
  const displayEnd =
    state.kind === 'start' && !canChooseEnd
      ? state.expectedEndAt
      : planned || requiredPlan
      ? endedAt
      : null;
  const pickerNow = Date.now();
  const pickerEndLimit =
    state.kind === 'start'
      ? Math.max(
          pickerNow,
          state.hardCapAt || startedAt + state.config.hardCapHours * 3600000,
        )
      : pickerNow;
  // Pickers use the device's local time; reporting timezone is kept internally.
  const localTime = (time: number) =>
    cachedDateFormatter('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(time));
  const localDay = (time: number) =>
    cachedDateFormatter('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(time));
  const save = async () => {
    setValidation('');
    if (state.kind === 'start') {
      if (!state.jobId && !state.existingSessionId && !workName.trim()) {
        setValidation('Enter a name for this work.');
        return;
      }
      if (
        !state.jobId &&
        !state.existingSessionId &&
        workEarningsError(expectedEarnings)
      ) {
        setValidation(workEarningsError(expectedEarnings));
        return;
      }
      if (!isValidTimeZone(zone)) {
        setValidation('Close this form and try again to refresh your work settings.');
        return;
      }
      if (
        !state.existingSessionId &&
        (startedAt > Date.now() ||
          Date.now() - startedAt >= state.config.hardCapHours * 3600000)
      ) {
        setValidation(
          `Select a current or past start within the last ${state.config.hardCapHours} hours. Use a manual record for older work.`,
        );
        return;
      }
      if (
        (planned || requiredPlan) &&
        (endedAt <= Date.now() ||
          endedAt >
            (state.hardCapAt ||
              startedAt + state.config.hardCapHours * 3600000))
      ) {
        setValidation(
          `End time must be after the current time and within ${state.config.hardCapHours} hours of your start.`,
        );
        return;
      }
      await onSave({
        reportingTimeZone: zone,
        ...(!state.existingSessionId ? {startedAt} : {}),
        ...(!state.jobId && !state.existingSessionId
          ? {workName: workName.trim()}
          : {}),
        ...(!state.jobId &&
        !state.existingSessionId &&
        parseWorkEarnings(expectedEarnings) !== undefined
          ? {expectedEarnings: parseWorkEarnings(expectedEarnings)}
          : {}),
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
      animationType={state.kind === 'finish' ? 'slide' : 'fade'}
      onRequestClose={() => {
        if (!busy) {
          onClose();
        }
      }}>
      <KeyboardAvoidingView
        style={[
          styles.backdrop,
          state.kind === 'finish' && styles.bottomBackdrop,
          {paddingTop: insets.top + 12},
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.sheet,
            state.kind === 'start' && styles.startSheet,
            state.kind === 'finish' && styles.bottomSheet,
          ]}>
          {state.kind === 'finish' && <View style={workStyles.handle} />}
          {state.kind === 'start' ? (
            <View style={styles.startHeader}>
              <WorkIconTile
                icon="play-circle-outline"
                color={Colors.gradient1}
                bg={Colors.blueOverlay10}
                size={24}
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {state.existingSessionId ? 'Plan your finish' : 'Start work'}
                </Text>
                {/* <Text style={styles.help}>
                  {state.existingSessionId
                    ? 'Set a finish-time reminder'
                    : 'Give your work a name and track your time'}
                </Text> */}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close work dialog"
                disabled={busy}
                hitSlop={4}
                onPress={onClose}
                style={styles.headerClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={21}
                  color={Colors.secondaryText}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close work dialog"
              disabled={busy}
              onPress={onClose}
              style={styles.close}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          )}
          <ScrollView
            style={{flexShrink: 1}}
            contentContainerStyle={[
              styles.content,
              state.kind === 'start' && styles.startContent,
              fontScale > 1.2 && {gap: 16},
            ]}
            keyboardShouldPersistTaps="handled">
            {state.kind !== 'start' && (
              <>
                <View
                  style={[
                    workStyles.row,
                    state.kind === 'checkIn' && {justifyContent: 'center'},
                  ]}>
                  <WorkIconTile
                    icon={
                      state.kind === 'checkIn'
                        ? 'clock-outline'
                        : state.kind === 'finish'
                        ? 'alert-outline'
                        : 'play-circle-outline'
                    }
                    color={
                      state.kind === 'finish'
                        ? Colors.amberDarkText
                        : Colors.gradient1
                    }
                    bg={
                      state.kind === 'finish'
                        ? Colors.amberOverlay10
                        : Colors.blueOverlay10
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    state.kind === 'checkIn' && styles.centered,
                  ]}>
                  {state.kind === 'checkIn'
                    ? 'Still working?'
                    : state.editing
                    ? 'Correct this work record'
                    : 'Confirm your work time'}
                </Text>
                <Text
                  style={[
                    styles.text,
                    state.kind === 'checkIn' && styles.centered,
                  ]}>
                  {workSessionTitle(state.session)}
                </Text>
              </>
            )}
            {state.kind === 'checkIn' ? (
              <>
                <Text style={styles.help}>
                  You clocked in at{' '}
                  {formatWorkTime(
                    state.session.startedAt,
                    state.session.reportingTimeZone,
                  )}
                  {state.session.expectedEndAt !== null
                    ? ` and this job was expected to finish at ${formatWorkTime(
                        state.session.expectedEndAt,
                        state.session.reportingTimeZone,
                      )}`
                    : ''}
                  . Continuing keeps the original stop deadline.
                </Text>
                <View style={[workStyles.inner, workStyles.rowBetween]}>
                  <Text style={workStyles.sml}>Running total</Text>
                  <Text style={[workStyles.mid, workStyles.mono]}>
                    {formatWorkTimer(tick - state.session.startedAt)}
                  </Text>
                </View>
                <Text style={styles.help}>
                  Timer stops by{' '}
                  {formatWorkTime(
                    state.session.autoStopAt,
                    state.session.reportingTimeZone,
                  )}
                  .
                </Text>
                <WorkButton
                  label="Yes, still working"
                  disabled={busy || pending}
                  onPress={onContinue}
                />
                <WorkButton
                  variant="ghost"
                  label="No — I finished at…"
                  disabled={busy || pending}
                  onPress={onFinish}
                />
                <Text style={styles.help}>
                  We never count time you did not work. Nothing is added until
                  you confirm.
                </Text>
              </>
            ) : (
              <>
                {state.kind === 'start' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Work name</Text>
                      <View
                        style={[
                          styles.nameField,
                          nameFocused && styles.focusedField,
                        ]}>
                        <MaterialCommunityIcons
                          name="briefcase-outline"
                          size={20}
                          color={Colors.secondaryText}
                        />
                        <TextInput
                          value={workName}
                          onChangeText={setWorkName}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                          editable={
                            !busy &&
                            !pending &&
                            !state.jobId &&
                            !state.existingSessionId
                          }
                          placeholder="e.g. Office deep clean"
                          placeholderTextColor={Colors.secondaryText}
                          maxLength={120}
                          autoCapitalize="sentences"
                          returnKeyType="done"
                          style={styles.nameInput}
                          accessibilityLabel="Work name"
                        />
                      </View>
                    </View>
                    {!state.jobId && !state.existingSessionId && (
                      <GeneralWorkEarningsField
                        value={expectedEarnings}
                        onChange={setExpectedEarnings}
                        disabled={busy || pending}
                      />
                    )}
                    <View
                      style={[
                        styles.timeRow,
                        (width < 360 || fontScale > 1.2) && styles.stackedTimes,
                      ]}>
                      <View style={styles.timeGroup}>
                        <Text style={styles.inputLabel}>Start time</Text>
                        <TouchableOpacity
                          style={styles.timeField}
                          disabled={
                            !!state.existingSessionId || busy || pending
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Select start time"
                          onPress={() => setPicker('start')}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={17}
                            color={Colors.gradient1}
                          />
                          <View style={styles.timeText}>
                            <Text style={styles.timeValue}>
                              {localTime(displayStart)}
                            </Text>
                            <Text style={styles.timeDate}>
                              {localDay(displayStart)}
                            </Text>
                          </View>
                          {!state.existingSessionId && (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={16}
                              color={Colors.secondaryText}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      <View style={styles.timeGroup}>
                        <Text style={styles.inputLabel}>End time</Text>
                        <TouchableOpacity
                          style={styles.timeField}
                          disabled={!canChooseEnd || busy || pending}
                          accessibilityRole="button"
                          accessibilityLabel="Select end time"
                          onPress={() => {
                            if (
                              state.hardCapAt &&
                              state.hardCapAt <= Date.now()
                            ) {
                              setValidation(
                                'This timer has reached its stop deadline. Close this dialog and review your work time.',
                              );
                              return;
                            }
                            setPicker('finish');
                          }}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={17}
                            color={Colors.gradient1}
                          />
                          <View style={styles.timeText}>
                            <Text style={styles.timeValue}>
                              {localTime(displayEnd ?? endedAt)}
                            </Text>
                            <Text style={styles.timeDate}>
                              {localDay(displayEnd ?? endedAt)}
                            </Text>
                          </View>
                          {canChooseEnd && (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={16}
                              color={Colors.secondaryText}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    {requiredPlan && (
                      <Text style={styles.warning}>
                        The original stop deadline has passed. Select a new end
                        time to start.
                      </Text>
                    )}
                   
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
                      {/* <Text style={styles.warning}>
                        {discard
                          ? 'Keep this record and enter times'
                          : 'Discard this record instead'}
                      </Text> */}
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
              </>
            )}
            {/* {state.kind !== 'start' && (
              <TouchableOpacity
                style={styles.secondary}
                disabled={busy}
                onPress={onClose}>
                <Text style={styles.help}>Not now</Text>
              </TouchableOpacity>
            )} */}
          </ScrollView>
          {state.kind !== 'checkIn' && (
            <View
              style={[
                workStyles.footer,
                {
                  paddingBottom:
                    state.kind === 'start' ? 20 : Math.max(insets.bottom, 16),
                },
              ]}>
              {pending ? (
                <TouchableOpacity
                  style={styles.primary}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={onRetry}>
                  <Text style={styles.white}>Retry unfinished save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primary}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={save}>
                  {busy ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <View style={styles.actionContent}>
                      {state.kind === 'start' && !state.existingSessionId && (
                        <MaterialCommunityIcons
                          name="play"
                          size={20}
                          color={Colors.white}
                        />
                      )}
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
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
          <DatePicker
            modal
            open={picker !== null}
            mode="datetime"
            date={
              new Date(
                state.kind === 'start'
                  ? picker === 'start'
                    ? Math.min(startedAt, pickerNow)
                    : Math.min(Math.max(endedAt, pickerNow), pickerEndLimit)
                  : picker === 'start'
                  ? startedAt
                  : endedAt,
              )
            }
            title={picker === 'start' ? 'Start time' : 'End time'}
            minimumDate={
              state.kind === 'start'
                ? new Date(
                    picker === 'start'
                      ? pickerNow - state.config.hardCapHours * 3600000 + 1
                      : pickerNow,
                  )
                : undefined
            }
            maximumDate={
              new Date(picker === 'start' ? pickerNow : pickerEndLimit)
            }
            onConfirm={date => {
              if (picker === 'start') {
                const selectedStart = date.getTime();
                setStartedAt(selectedStart);
                if (state.kind === 'start' && canChooseEnd) {
                  setEndedAt(end =>
                    Math.min(
                      end,
                      selectedStart + state.config.hardCapHours * 3600000,
                    ),
                  );
                }
              } else {
                setEndedAt(date.getTime());
                if (state.kind === 'start') {
                  setPlanned(true);
                }
              }
              setPicker(null);
            }}
            onCancel={() => setPicker(null)}
          />
        </View>
      </KeyboardAvoidingView>
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
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  startSheet: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  startHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerText: {flex: 1, minWidth: 0, gap: 4},
  headerClose: {
    width: 36,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startContent: {paddingTop: 16, gap: 14},
  inputGroup: {gap: 8},
  inputLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.slateText,
    flexShrink: 1,
  },
  nameField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontFamily: Fonts.fontMedium,
    fontSize: 15,
    color: Colors.slateText,
  },
  focusedField: {borderColor: Colors.gradient1, backgroundColor: Colors.white},
  timeRow: {flexDirection: 'row', gap: 12, alignItems: 'stretch'},
  stackedTimes: {flexDirection: 'column'},
  timeGroup: {flex: 1, minWidth: 0, gap: 6},
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  timeText: {flex: 1, minWidth: 0, gap: 2},
  timeValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.slateText,
  },
  timeDate: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11,
    color: Colors.secondaryText,
  },
  actionContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBackdrop: {
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  bottomSheet: {
    maxHeight: '92%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  close: {
    alignSelf: 'flex-end',
    marginRight: 12,
    marginTop: 6,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {textAlign: 'center'},
  content: {paddingHorizontal: 20, paddingBottom: 20, gap: 12},
  title: {fontFamily: Fonts.fontBold, fontSize: 18, color: Colors.slateText},
  text: {fontFamily: Fonts.fontMedium, fontSize: 16, color: Colors.slateText},
  help: {
    fontFamily: Fonts.fontRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.secondaryText,
  },
  primary: {
    backgroundColor: Colors.gradient1,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  white: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'center',
  },
  secondary: {padding: 12, alignItems: 'center'},
  warning: {fontFamily: Fonts.fontRegular, color: Colors.amberDarkText, fontSize: 14, lineHeight: 21},
});
