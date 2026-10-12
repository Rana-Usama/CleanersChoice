import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useEffect, useRef, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {workStyles as styles} from '../../../components/work/workTheme';
import {WorkButton, WorkIconTile} from '../../../components/work/WorkUI';
import {GeneralWorkEarningsField} from '../../../components/work/GeneralWorkEarningsField';
import {
  parseWorkEarnings,
  workEarningsError,
} from '../../../utils/workGeneralEarnings';
import {Colors} from '../../../constants/Themes';
import {
  WorkTimeFields,
  WorkTimeValues,
} from '../../../components/work/WorkTimeFields';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {
  deviceWorkTimeZone,
  formatWorkDuration,
} from '../../../utils/workSessionFlow';
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
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setExpectedEarnings('');
    setWorkName('');
    setError('');
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
  const displayedZone = pendingManual?.reportingTimeZone || zone.trim();
  const displayedAmount = pendingManual
    ? pendingManual.expectedEarnings?.toFixed(2) ?? ''
    : expectedEarnings;
  const general = !pendingManual?.jobId;
  const displayedName = pendingManual
    ? pendingManual.workName || 'Saved work'
    : workName;
  const validation =
    (!pendingManual && !workName.trim() ? 'Enter a name for this work.' : '') ||
    (general ? workEarningsError(displayedAmount) : '') ||
    workIntervalError(displayed, work.config, work.now, work.user, true);
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
  return (
    <WorkRecordLayout
      sheet
      title="Add record manually"
      onBack={() => navigation.goBack()}
      footer={
        <WorkButton
          label={work.busy ? 'Saving…' : 'Save pending record'}
          disabled={locked || !work.manualAvailable || !!validation}
          onPress={save}
        />
      }>
      <Text style={styles.help}>
        Forgot to clock in? Log it here. Save a pending record, then check and
        confirm its actual times. Only confirmed hours count. This does not mark
        an invoice paid.
      </Text>
      {!work.manualAvailable && (
        <Text style={styles.error}>
          New manual entries are unavailable. Your account must meet the cleaner
          requirements and have subscription access within the allowed entry
          window.
        </Text>
      )}
      {work.pending && (
        <View style={styles.card}>
          <Text style={styles.title}>A save needs checking</Text>
          <Text style={styles.help}>
            {pendingManual
              ? `Retry the saved manual entry (${
                  pendingManual.workName ||
                  (pendingManual.jobId ? 'saved linked job' : 'saved work')
                }) using its original times and note.`
              : 'Resolve the earlier work action before adding another record.'}
          </Text>
          <TouchableOpacity disabled={work.busy} onPress={retry}>
            <Text style={styles.link}>Retry saved action</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.body}>Work name</Text>
        <TextInput
          accessibilityLabel="Work name"
          style={styles.input}
          value={displayedName}
          onChangeText={setWorkName}
          editable={!locked}
          placeholder="e.g. Office deep clean"
          placeholderTextColor={Colors.secondaryText}
          maxLength={120}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        <Text style={styles.help}>
          Start within the last {work.config.manualEntryMaxAgeDays} days.
          Maximum {work.config.hardCapHours} hours per record. Past work must
          finish within your recorded subscription access period.
        </Text>
        {general && (
          <GeneralWorkEarningsField
            value={displayedAmount}
            onChange={setExpectedEarnings}
            disabled={locked}
          />
        )}
        <WorkTimeFields
          value={displayed}
          onChange={setValue}
          disabled={locked}
          reportingTimeZone={displayedZone}
        />
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.sml}>Duration</Text>
          <Text style={styles.title}>
            {displayed.endedAt > displayed.startedAt
              ? formatWorkDuration(displayed.endedAt - displayed.startedAt)
              : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        {checks.map(check => (
          <View key={check.label} style={styles.row}>
            <MaterialCommunityIcons
              name={check.ok ? 'check' : 'close'}
              size={16}
              color={check.ok ? Colors.success : Colors.red500}
            />
            <Text
              style={[
                styles.sml,
                styles.grow,
                !check.ok && {color: Colors.red500},
              ]}>
              {check.label}
            </Text>
          </View>
        ))}
      </View>

      {!!validation && <Text style={styles.error}>{validation}</Text>}
      {!!(error || work.error) && (
        <Text style={styles.error}>{error || work.error}</Text>
      )}

      <View style={[styles.card, styles.warnCard, styles.row]}>
        <WorkIconTile
          icon="alert-outline"
          color={Colors.amberDarkText}
          bg={Colors.amberOverlay20}
        />
        <Text style={[styles.sml, styles.grow, {color: Colors.amberDarkText}]}>
          Manual records are saved as Needs review and do not count toward your
          month until you confirm them.
        </Text>
      </View>
    </WorkRecordLayout>
  );
};
export default ManualWorkEntry;
