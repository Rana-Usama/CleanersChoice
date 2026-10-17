import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {WorkButton} from '../../../components/work/WorkUI';
import {ManualTimeFields} from '../../../components/work/ManualTimeFields';
import {
  parseWorkEarnings,
  workEarningsError,
} from '../../../utils/workGeneralEarnings';
import {Colors, Fonts} from '../../../constants/Themes';
import type {WorkTimeValues} from '../../../components/work/WorkTimeFields';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {deviceWorkTimeZone} from '../../../utils/workSessionFlow';
import {workIntervalError} from '../../../utils/workSessionEntry';
import {
  entitlementEnd,
  HOUR_MS,
} from '../../../../functions/src/workSessions/model';
import {isValidTimeZone} from '../../../utils/intlCache';

const ManualWorkEntry = ({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'ManualWorkEntry'>) => {
  const work = useWorkSessions();
  const {uid} = work;
  const [value, setValue] = useState<WorkTimeValues>(() => {
    const end = Math.min(Date.now() - 60000, entitlementEnd(work.user || {}));
    return {startedAt: Math.max(0, end - HOUR_MS), endedAt: end, note: ''};
  });
  const [expectedEarnings, setExpectedEarnings] = useState('');
  const [zone, setZone] = useState(deviceWorkTimeZone);
  const [workName, setWorkName] = useState('');
  const [error, setError] = useState('');
  // Optional extras stay folded until wanted.
  const [amountOpen, setAmountOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const generation = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  /**
   * Amount and Note sit at the bottom of the form, so once the keyboard is up
   * scroll the sheet to the end to bring the focused field above it. The
   * timer covers a keyboard that was already open (moving between fields).
   */
  const revealBottom = () => {
    const reveal = () => scrollRef.current?.scrollToEnd({animated: true});
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      shown.remove();
      reveal();
    });
    setTimeout(() => {
      shown.remove();
      reveal();
    }, 350);
  };
  useEffect(() => {
    const current = ++generation.current;
    setExpectedEarnings('');
    setWorkName('');
    setError('');
    setAmountOpen(false);
    setNoteOpen(false);
    setNameTouched(false);
    const end = Math.min(Date.now() - 60000, entitlementEnd(work.user || {}));
    setValue({startedAt: Math.max(0, end - HOUR_MS), endedAt: end, note: ''});
    setZone(deviceWorkTimeZone());
    if (uid) {
      AsyncStorage.getItem(`work-reporting-zone:${uid}`)
        .then(saved => {
          if (
            generation.current === current &&
            saved &&
            isValidTimeZone(saved)
          ) {
            setZone(saved);
          }
        })
        .catch(() => {});
    }
    return () => {
      generation.current += 1;
    };
    // Account changes clear the form; live entitlement updates validate without erasing input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  const pendingManual =
    work.pendingRequest?.action === 'addManual' ? work.pendingRequest : null;
  const displayed = pendingManual
    ? {
        startedAt: pendingManual.startedAt!,
        endedAt: pendingManual.endedAt!,
        note: pendingManual.note || '',
      }
    : value;
  const displayedAmount = pendingManual
    ? pendingManual.expectedEarnings?.toFixed(2) ?? ''
    : expectedEarnings;
  const general = !pendingManual?.jobId;
  const displayedName = pendingManual
    ? pendingManual.workName || 'Saved work'
    : workName;
  const nameError =
    !pendingManual && !workName.trim() ? 'Enter a name for this work.' : '';
  const amountError = general ? workEarningsError(displayedAmount) : '';
  const intervalError = workIntervalError(
    displayed,
    work.config,
    work.now,
    work.user,
    true,
  );
  const validation = nameError || amountError || intervalError;
  const locked = work.busy || work.pending;
  /**
   * The wireframe's checklist. These mirror the rules workIntervalError
   * enforces, so the cleaner can see which one they are failing rather than
   * only the first message it returns. Overlap is deliberately absent: only
   * the server knows the other sessions, so it surfaces as the error line.
   */
  const checks = [
    {
      label: 'End is after start',
      ok: displayed.endedAt > displayed.startedAt,
    },
    {
      label: 'Not in the future',
      ok: displayed.endedAt <= work.now,
    },
    {
      label: `Starts within the last ${work.config.manualEntryMaxAgeDays} days`,
      ok:
        work.now - displayed.startedAt <=
        work.config.manualEntryMaxAgeDays * 24 * HOUR_MS,
    },
    {
      label: `Under the ${work.config.hardCapHours}h limit`,
      ok:
        displayed.endedAt - displayed.startedAt <=
        work.config.hardCapHours * HOUR_MS,
    },
  ];
  const save = async () => {
    if (!uid || locked || !work.manualAvailable || validation) {
      return;
    }
    const current = generation.current;
    setError('');
    try {
      const result = await work.saveManual({
        ...value,
        reportingTimeZone: zone.trim(),
        jobId: null,
        workName: workName.trim(),
        ...(parseWorkEarnings(expectedEarnings) !== undefined
          ? {expectedEarnings: parseWorkEarnings(expectedEarnings)}
          : {}),
        note: value.note.trim(),
      });
      if (generation.current !== current || auth().currentUser?.uid !== uid) {
        return;
      }
      if (result.status !== 'needsReview') {
        throw new Error('Reload this record to check its current status.');
      }
      AsyncStorage.setItem(`work-reporting-zone:${uid}`, zone.trim()).catch(
        () => {},
      );
      navigation.replace('WorkSessionDetails', {sessionId: result.sessionId});
    } catch (failure) {
      if (generation.current === current) {
        setError((failure as Error).message);
      }
    }
  };
  const retry = async () => {
    const current = generation.current;
    const action = work.pendingRequest?.action;
    try {
      const result = await work.retry();
      if (
        result &&
        action === 'addManual' &&
        generation.current === current &&
        auth().currentUser?.uid === uid
      ) {
        navigation.replace('WorkSessionDetails', {sessionId: result.sessionId});
      }
    } catch (failure) {
      if (generation.current === current) {
        setError((failure as Error).message);
      }
    }
  };
  const failed = checks.filter(check => !check.ok);
  // The four rules read as one line; it turns red only when one fails.
  const ruleText = failed.length
    ? failed.map(check => check.label).join(' · ')
    : intervalError ||
      `Within the last ${work.config.manualEntryMaxAgeDays} days · under ${work.config.hardCapHours} hours`;
  const ruleOk = !failed.length && !intervalError;
  const showAmount =
    general && (amountOpen || (!!pendingManual && !!displayedAmount));
  const showNote = noteOpen || (!!pendingManual && !!displayed.note);
  const ghost = (label: string, open: boolean, toggle: () => void) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{expanded: open, disabled: locked}}
      activeOpacity={0.8}
      disabled={locked}
      onPress={toggle}
      style={[q.ghost, open && q.ghostOpen]}>
      <Text style={[q.ghostText, open && q.ghostTextOpen]}>
        {`${open ? '−' : '+'} ${label}`}
      </Text>
    </TouchableOpacity>
  );
  return (
    <WorkRecordLayout
      sheet
      title="Add record"
      subtitle="Forgot to clock in? Log it here."
      scrollRef={scrollRef}
      onBack={() => navigation.goBack()}
      footer={
        <>
          <WorkButton
            label={work.busy ? 'Saving…' : 'Save pending record'}
            disabled={locked || !work.manualAvailable || !!validation}
            onPress={save}
            style={q.save}
          />
          <Text style={q.caption}>
            Saved as Needs review — it counts after you confirm it.
          </Text>
        </>
      }>
      {!work.manualAvailable && (
        <Text style={q.errorText}>
          New manual entries are unavailable. Your account must meet the cleaner
          requirements and have subscription access within the allowed entry
          window.
        </Text>
      )}
      {work.pending && (
        <View style={q.pendingCard}>
          <Text style={q.pendingTitle}>A save needs checking</Text>
          <Text style={q.pendingText}>
            {pendingManual
              ? `Retry the saved manual entry (${
                  pendingManual.workName ||
                  (pendingManual.jobId ? 'saved linked job' : 'saved work')
                }) using its original times and note.`
              : 'Resolve the earlier work action before adding another record.'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={work.busy}
            onPress={retry}>
            <Text style={q.retry}>Retry saved action</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={q.group}>
        <Text style={q.label}>Work name</Text>
        <TextInput
          accessibilityLabel="Work name"
          style={[q.input, nameTouched && !!nameError && q.inputError]}
          value={displayedName}
          onChangeText={text => {
            setWorkName(text);
            setNameTouched(true);
          }}
          onBlur={() => setNameTouched(true)}
          editable={!locked}
          placeholder="e.g. Office deep clean"
          placeholderTextColor={Colors.gray400}
          maxLength={120}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        {nameTouched && !!nameError && (
          <Text style={q.fieldError}>{nameError}</Text>
        )}
      </View>

      <ManualTimeFields
        value={displayed}
        onChange={setValue}
        disabled={locked}
        now={work.now}
        maxAgeDays={work.config.manualEntryMaxAgeDays}
      />

      <View style={q.ghostRow}>
        {general &&
          ghost('Amount', showAmount, () => {
            if (showAmount) {
              setExpectedEarnings('');
            }
            setAmountOpen(!showAmount);
          })}
        {ghost('Note', showNote, () => {
          if (showNote) {
            setValue(current => ({...current, note: ''}));
          }
          setNoteOpen(!showNote);
        })}
      </View>
      {showAmount && (
        <View style={q.group}>
          <Text style={q.label}>Total amount for this work</Text>
          <View style={[q.input, q.amountField, !!amountError && q.inputError]}>
            <Text style={q.currency}>$</Text>
            <TextInput
              accessibilityLabel="Total amount for this work"
              value={displayedAmount}
              autoFocus={amountOpen && !pendingManual}
              onFocus={revealBottom}
              onChangeText={setExpectedEarnings}
              editable={!locked}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.gray400}
              maxLength={12}
              style={q.amountInput}
            />
          </View>
          {!!amountError && <Text style={q.fieldError}>{amountError}</Text>}
        </View>
      )}
      {showNote && (
        <View style={q.group}>
          <Text style={q.label}>Note</Text>
          <TextInput
            accessibilityLabel="Note"
            value={displayed.note}
            autoFocus={noteOpen && !pendingManual}
            onFocus={revealBottom}
            onChangeText={note => setValue(current => ({...current, note}))}
            editable={!locked}
            maxLength={1000}
            multiline
            placeholder="Add context for this work"
            placeholderTextColor={Colors.gray400}
            style={[q.input, q.note]}
          />
        </View>
      )}

      <View
        accessibilityRole={ruleOk ? undefined : 'alert'}
        style={[q.rule, !ruleOk && q.ruleFailed]}>
        <MaterialCommunityIcons
          name={ruleOk ? 'check' : 'alert-circle-outline'}
          size={16}
          color={ruleOk ? RULE_OK : RULE_FAILED}
        />
        <Text style={[q.ruleText, !ruleOk && {color: RULE_FAILED}]}>
          {ruleText}
        </Text>
      </View>

      {!!(error || work.error) && (
        <Text style={q.errorText}>{error || work.error}</Text>
      )}
    </WorkRecordLayout>
  );
};

const RULE_OK = '#047857';
const RULE_FAILED = '#B91C1C';
const q = StyleSheet.create({
  group: {gap: 6},
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.fontRegular,
    fontSize: 14.5,
    color: Colors.slateText,
    backgroundColor: Colors.white,
  },
  inputError: {borderColor: Colors.red500},
  fieldError: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: RULE_FAILED,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 0,
  },
  currency: {
    fontFamily: Fonts.fontRegular,
    fontSize: 14.5,
    color: Colors.slateText,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontFamily: Fonts.fontRegular,
    fontSize: 14.5,
    color: Colors.slateText,
  },
  note: {textAlignVertical: 'top', maxHeight: 120},
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
  ghostOpen: {
    borderColor: Colors.gradient1,
    backgroundColor: Colors.blueBg200,
  },
  ghostText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  ghostTextOpen: {color: Colors.gradient1},
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
    color: RULE_OK,
  },
  pendingCard: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberBg50,
  },
  pendingTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: Colors.amberDarkText,
  },
  pendingText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.amberDarkText,
  },
  retry: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.gradient1,
    paddingTop: 4,
  },
  errorText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: RULE_FAILED,
  },
  save: {minHeight: 50},
  caption: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
export default ManualWorkEntry;
