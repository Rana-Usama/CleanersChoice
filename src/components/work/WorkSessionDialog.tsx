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
  formatWorkDuration,
  formatWorkTime,
  formatWorkTimer,
  workSessionTitle,
} from '../../utils/workSessionFlow';
import {cachedDateFormatter, isValidTimeZone} from '../../utils/intlCache';
import {ManualTimeFields} from './ManualTimeFields';
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
  quickWorkTimes,
  workIntervalError,
  workStopExplanation,
} from '../../utils/workSessionEntry';

const DANGER = '#B91C1C';
const SUCCESS = '#047857';
/** The month a time's hours land in, in the record's reporting zone. */
const monthOf = (time: number, timeZone: string) =>
  cachedDateFormatter('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(time));

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
  const [noteOpen, setNoteOpen] = useState(false);
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
      setNoteOpen(!state.editing && !!state.session.note);
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
        setValidation(
          'Close this form and try again to refresh your work settings.',
        );
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
  if (state.kind === 'checkIn') {
    const {session} = state;
    const zone = session.reportingTimeZone;
    const sameDay = (time: number) =>
      cachedDateFormatter('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(time)) ===
      cachedDateFormatter('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(tick));
    // Time only for today; the full date when it falls on another day.
    const when = (time: number) =>
      sameDay(time)
        ? cachedDateFormatter('en-US', {
            timeZone: zone,
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date(time))
        : formatWorkTime(time, zone);
    const pastBy =
      session.expectedEndAt !== null ? tick - session.expectedEndAt : null;
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
        <View
          style={[
            styles.backdrop,
            {paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12},
          ]}>
          <View style={k.card}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close work dialog"
              disabled={busy}
              hitSlop={5}
              onPress={onClose}
              style={[c.close, k.close]}>
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
            <ScrollView
              style={{flexShrink: 1}}
              contentContainerStyle={k.body}
              showsVerticalScrollIndicator={false}>
              <View style={k.header}>
                {/* <View style={k.icon}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={26}
                    color={Colors.gradient1}
                  />
                </View> */}
                <Text style={k.title}>Still working?</Text>
                <Text style={k.job} numberOfLines={2}>
                  {workSessionTitle(session)}
                </Text>
              </View>

              {/* The live number is the point of the prompt */}
              <View style={k.timerPanel}>
                <Text style={k.timerLabel}>Running total</Text>
                <Text
                  style={k.timer}
                  accessibilityLabel={`Running total ${formatWorkTimer(
                    tick - session.startedAt,
                  )}`}>
                  {formatWorkTimer(tick - session.startedAt)}
                </Text>
                <View style={k.since}>
                  <View style={k.liveDot} />
                  <Text style={k.sinceText}>
                    Since {when(session.startedAt)}
                  </Text>
                </View>
              </View>

              <View style={k.stats}>
                {session.expectedEndAt !== null && (
                  <View style={k.stat}>
                    <Text style={k.statLabel}>Expected finish</Text>
                    <Text style={k.statValue}>
                      {when(session.expectedEndAt)}
                    </Text>
                    {pastBy !== null && pastBy >= 60000 && (
                      <Text style={k.statLate}>
                        {formatWorkDuration(pastBy)} ago
                      </Text>
                    )}
                  </View>
                )}
                <View style={k.stat}>
                  <Text style={k.statLabel}>Timer stops by</Text>
                  <Text style={k.statValue}>{when(session.autoStopAt)}</Text>
                </View>
              </View>

              <View style={k.actions}>
                <WorkButton
                  label="Yes, still working"
                  disabled={busy || pending}
                  onPress={onContinue}
                  style={c.save}
                />
                <WorkButton
                  variant="ghost"
                  label="No — I finished at…"
                  disabled={busy || pending}
                  onPress={onFinish}
                  style={c.save}
                />
              </View>
              <Text style={k.note}>
                Continuing keeps the original stop time. We never count time you
                did not work.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
  if (state.kind === 'finish') {
    const {session} = state;
    const editing = !!state.editing;
    const length = endedAt - startedAt;
    const liveError = workIntervalError(
      {startedAt, endedAt, note},
      session.timingConfig,
      Date.now(),
    );
    const startMonth = monthOf(startedAt, session.reportingTimeZone);
    const endMonth = monthOf(
      Math.max(startedAt, endedAt - 1),
      session.reportingTimeZone,
    );
    const impact =
      startMonth === endMonth
        ? `${formatWorkDuration(length)} · counted in ${startMonth}`
        : `${formatWorkDuration(
            length,
          )} · split between ${startMonth} and ${endMonth}`;
    const showNote = editing || noteOpen;
    const quick =
      !editing &&
      session.status === 'needsReview' &&
      session.source === 'clock';
    const title = discard
      ? 'Discard record'
      : editing
      ? 'Correct record'
      : 'Confirm work time';
    const savedLength =
      (session.endedAt ?? session.autoStopAt) - session.startedAt;
    return (
      <Modal
        transparent
        visible
        animationType="slide"
        onRequestClose={() => {
          if (!busy) {
            onClose();
          }
        }}>
        <KeyboardAvoidingView
          style={[
            styles.backdrop,
            styles.bottomBackdrop,
            {paddingTop: insets.top + 12},
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, styles.bottomSheet]}>
            <View style={workStyles.handle} />
            <View style={workStyles.sheetHeader}>
              <View style={workStyles.grow}>
                <Text style={workStyles.sheetTitle}>{title}</Text>
                <Text style={workStyles.sheetSubtitle} numberOfLines={1}>
                  {workSessionTitle(session)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close work dialog"
                disabled={busy}
                hitSlop={5}
                onPress={onClose}
                style={c.close}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={Colors.secondaryText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{flexShrink: 1}}
              contentContainerStyle={c.body}
              keyboardShouldPersistTaps="handled">
              {discard ? (
                <View style={c.discardCard}>
                  <View style={c.discardIcon}>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color={DANGER}
                    />
                  </View>
                  <View style={workStyles.grow}>
                    <Text style={c.discardTitle}>Discard this record?</Text>
                    <Text style={c.discardText}>
                      This will exclude all hours from this record
                      {savedLength > 0
                        ? ` (${formatWorkDuration(savedLength)})`
                        : ''}
                      . Its history is retained.
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  {editing ? (
                    <View style={c.savedRow}>
                      <Text style={c.label}>Currently saved</Text>
                      <Text style={c.savedValue}>
                        {localTime(session.startedAt)} –{' '}
                        {session.endedAt === null
                          ? 'Open'
                          : localTime(session.endedAt)}
                        {savedLength > 0
                          ? ` · ${formatWorkDuration(savedLength)}`
                          : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={c.notice}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={16}
                        color={Colors.amberDarkText}
                      />
                      <Text style={c.noticeText}>
                        {session.source === 'manualCleaner'
                          ? 'This manual record is pending. Confirm the actual times to count its hours.'
                          : workStopExplanation(session.stopReason)}
                      </Text>
                    </View>
                  )}

                  {quick && (
                    <View style={c.group}>
                      <Text style={c.label}>Quick fill</Text>
                      <View style={c.quickRow}>
                        {[4, 6, 8].map(hours => {
                          const times = quickWorkTimes(
                            session,
                            hours,
                            Date.now(),
                          );
                          const chosen =
                            !!times &&
                            times.startedAt === startedAt &&
                            times.endedAt === endedAt;
                          return (
                            <TouchableOpacity
                              key={hours}
                              accessibilityRole="button"
                              accessibilityState={{
                                selected: chosen,
                                disabled: !times,
                              }}
                              activeOpacity={0.8}
                              disabled={busy || pending || !times}
                              onPress={() => {
                                if (times) {
                                  setStartedAt(times.startedAt);
                                  setEndedAt(times.endedAt);
                                }
                              }}
                              style={[
                                c.quickChip,
                                chosen && c.quickChipOn,
                                !times && c.unavailable,
                              ]}>
                              <Text
                                style={[c.quickText, chosen && c.quickTextOn]}>
                                {hours}h
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <ManualTimeFields
                    value={{startedAt, endedAt, note}}
                    disabled={busy || pending}
                    now={Date.now()}
                    maxAgeDays={
                      session.timingConfig?.manualEntryMaxAgeDays ?? 7
                    }
                    onChange={value => {
                      setStartedAt(value.startedAt);
                      setEndedAt(value.endedAt);
                      setNote(value.note);
                    }}
                  />

                  {!editing && (
                    <View style={c.ghostRow}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityState={{expanded: noteOpen}}
                        activeOpacity={0.8}
                        disabled={busy || pending}
                        onPress={() => {
                          if (noteOpen) {
                            setNote('');
                          }
                          setNoteOpen(!noteOpen);
                        }}
                        style={[c.ghost, noteOpen && c.ghostOpen]}>
                        <Text
                          style={[c.ghostText, noteOpen && c.ghostTextOpen]}>
                          {noteOpen ? '− Note' : '+ Note'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {showNote && (
                    <View style={c.group}>
                      <View style={c.labelRow}>
                        <Text style={c.label}>
                          {editing ? 'Reason for correction' : 'Note'}
                        </Text>
                        {editing && <Text style={c.required}>Required</Text>}
                      </View>
                      <TextInput
                        accessibilityLabel={
                          editing ? 'Reason for correction' : 'Note'
                        }
                        value={note}
                        onChangeText={setNote}
                        editable={!busy && !pending}
                        maxLength={1000}
                        multiline
                        placeholder={
                          editing
                            ? 'e.g. Forgot to clock out on time'
                            : 'Add context for this work'
                        }
                        placeholderTextColor={Colors.gray400}
                        style={c.input}
                      />
                    </View>
                  )}

                  <View style={[c.rule, !!liveError && c.ruleFailed]}>
                    <MaterialCommunityIcons
                      name={liveError ? 'alert-circle-outline' : 'check'}
                      size={16}
                      color={liveError ? DANGER : SUCCESS}
                    />
                    <Text style={[c.ruleText, !!liveError && {color: DANGER}]}>
                      {liveError || impact}
                    </Text>
                  </View>
                </>
              )}
              {!!(validation || error) && (
                <Text accessibilityRole="alert" style={c.errorText}>
                  {validation || error}
                </Text>
              )}
            </ScrollView>

            <View
              style={[c.footer, {paddingBottom: Math.max(insets.bottom, 20)}]}>
              {pending ? (
                <WorkButton
                  label="Retry unfinished save"
                  disabled={busy}
                  onPress={onRetry}
                  style={c.save}
                />
              ) : discard ? (
                <View style={c.footerRow}>
                  <WorkButton
                    variant="ghost"
                    label="Cancel"
                    disabled={busy}
                    onPress={onClose}
                    style={workStyles.grow}
                  />
                  <WorkButton
                    variant="danger"
                    icon="trash-can-outline"
                    label="Discard record"
                    busy={busy}
                    onPress={save}
                    style={[c.save, c.footerPrimary]}
                  />
                </View>
              ) : (
                <>
                  <WorkButton
                    label={
                      editing ? 'Save corrected times' : 'Confirm these times'
                    }
                    busy={busy}
                    onPress={save}
                    style={c.save}
                  />
                  <Text style={c.caption}>
                    {editing
                      ? 'Your previous times stay in this record’s history.'
                      : 'Hours count as soon as you confirm.'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
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
      <KeyboardAvoidingView
        style={[styles.backdrop, {paddingTop: insets.top + 12}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[styles.sheet, state.kind === 'start' && styles.startSheet]}>
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
                        disabled={!!state.existingSessionId || busy || pending}
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
              ) : null}
              {!!(validation || error) && (
                <Text accessibilityRole="alert" style={styles.warning}>
                  {validation || error}
                </Text>
              )}
            </>
            {/* {state.kind !== 'start' && (
              <TouchableOpacity
                style={styles.secondary}
                disabled={busy}
                onPress={onClose}>
                <Text style={styles.help}>Not now</Text>
              </TouchableOpacity>
            )} */}
          </ScrollView>
          {
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
          }
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
  warning: {
    fontFamily: Fonts.fontRegular,
    color: Colors.amberDarkText,
    fontSize: 14,
    lineHeight: 21,
  },
});

/** The correct / confirm / discard sheet, matching the Add record quick form. */
const c = StyleSheet.create({
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 14},
  group: {gap: 6},
  labelRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  required: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.gradient1,
    backgroundColor: Colors.blueBg200,
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
  },
  savedValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.slateText,
    fontVariant: ['tabular-nums'],
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
  quickRow: {flexDirection: 'row', gap: 8},
  quickChip: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipOn: {
    borderColor: Colors.gradient1,
    backgroundColor: Colors.blueBg200,
  },
  quickText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.slateText,
  },
  quickTextOn: {color: Colors.gradient1},
  unavailable: {opacity: 0.4},
  ghostRow: {flexDirection: 'row', gap: 8},
  ghost: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.slate300,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostOpen: {borderColor: Colors.gradient1, backgroundColor: Colors.blueBg200},
  ghostText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  ghostTextOpen: {color: Colors.gradient1},
  input: {
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Fonts.fontRegular,
    fontSize: 14.5,
    color: Colors.slateText,
    textAlignVertical: 'top',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  ruleFailed: {backgroundColor: Colors.redBg50},
  ruleText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: 12,
    lineHeight: 17,
    color: SUCCESS,
  },
  errorText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: DANGER,
  },
  discardCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.redBg50,
    borderWidth: 1,
    borderColor: Colors.redBorder200,
  },
  discardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardTitle: {fontFamily: Fonts.semiBold, fontSize: 15, color: DANGER},
  discardText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.slateText,
    marginTop: 2,
  },
  footer: {backgroundColor: Colors.white, paddingHorizontal: 16, gap: 8},
  footerRow: {flexDirection: 'row', gap: 10},
  footerPrimary: {flex: 1.7},
  save: {minHeight: 50},
  caption: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});

/** The "Still working?" check-in. */
const k = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  close: {position: 'absolute', top: 12, right: 12, zIndex: 1},
  body: {padding: 20, paddingTop: 24, gap: 14},
  header: {alignItems: 'center', gap: 6, paddingHorizontal: 30},
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.blueBg200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {fontFamily: Fonts.semiBold, fontSize: 18, color: Colors.slateText},
  job: {
    fontFamily: Fonts.fontRegular,
    fontSize: 13.5,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  timerPanel: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  timerLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: 11.5,
    color: Colors.secondaryText,
  },
  timer: {
    fontFamily: Fonts.fontBold,
    fontSize: 34,
    lineHeight: 42,
    color: Colors.slateText,
    fontVariant: ['tabular-nums'],
  },
  since: {flexDirection: 'row', alignItems: 'center', gap: 6},
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sinceText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  stats: {flexDirection: 'row', gap: 10},
  stat: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: 2,
  },
  statLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    color: Colors.secondaryText,
  },
  statValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.slateText,
  },
  statLate: {
    fontFamily: Fonts.fontMedium,
    fontSize: 11.5,
    color: Colors.amberDarkText,
  },
  actions: {gap: 10, marginTop: 2},
  note: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    lineHeight: 17,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
