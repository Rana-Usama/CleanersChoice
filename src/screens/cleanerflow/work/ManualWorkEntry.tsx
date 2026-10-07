import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {
  WorkRecordLayout,
  workRecordStyles as styles,
} from '../../../components/work/WorkRecordLayout';
import {
  WorkTimeFields,
  WorkTimeValues,
} from '../../../components/work/WorkTimeFields';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {
  getManualWorkJobs,
  ManualWorkJob,
} from '../../../services/workSessionService';
import {deviceWorkTimeZone} from '../../../utils/workSessionFlow';
import {workIntervalError} from '../../../utils/workSessionEntry';
import {
  entitlementEnd,
  HOUR_MS,
} from '../../../../functions/src/workSessions/model';

const ManualWorkEntry = ({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'ManualWorkEntry'>) => {
  const work = useWorkSessions();
  const {uid} = work;
  const [value, setValue] = useState<WorkTimeValues>(() => {
    const end = Math.min(Date.now() - 60000, entitlementEnd(work.user || {}));
    return {startedAt: Math.max(0, end - HOUR_MS), endedAt: end, note: ''};
  });
  const [zone, setZone] = useState(deviceWorkTimeZone);
  const [job, setJob] = useState<ManualWorkJob | null>(null);
  const [jobs, setJobs] = useState<ManualWorkJob[]>([]);
  const [cursor, setCursor] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [choosingJob, setChoosingJob] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setJobs([]);
    setJobsLoading(false);
    setJobsError('');
    setJob(null);
    setCursor(null);
    setMore(false);
    setChoosingJob(false);
    setError('');
    const end = Math.min(Date.now() - 60000, entitlementEnd(work.user || {}));
    setValue({startedAt: Math.max(0, end - HOUR_MS), endedAt: end, note: ''});
    setZone(deviceWorkTimeZone());
    if (uid) {
      AsyncStorage.getItem(`work-reporting-zone:${uid}`)
        .then(saved => {
          if (generation.current === current && saved) {
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
  let zoneError = '';
  try {
    new Intl.DateTimeFormat('en', {timeZone: displayedZone}).format();
  } catch {
    zoneError = 'Enter a valid reporting timezone, such as America/New_York.';
  }
  const validation =
    zoneError ||
    workIntervalError(displayed, work.config, work.now, work.user, true);
  const locked = work.busy || work.pending;
  const loadJobs = async (older = false) => {
    if (!uid || jobsLoading) {
      return;
    }
    const current = generation.current;
    setJobsLoading(true);
    setJobsError('');
    try {
      const page = await getManualWorkJobs(older ? cursor : null);
      if (generation.current !== current || auth().currentUser?.uid !== uid) {
        return;
      }
      setJobs(prev => (older ? [...prev, ...page.jobs] : page.jobs));
      setCursor(page.cursor);
      setMore(page.hasMore);
    } catch {
      if (generation.current === current) {
        setJobsError(
          'Could not load assigned jobs. Retry or choose General work.',
        );
      }
    } finally {
      if (generation.current === current) {
        setJobsLoading(false);
      }
    }
  };
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
        jobId: job?.id || null,
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
    <WorkRecordLayout title="Add past work" onBack={() => navigation.goBack()}>
      <Text style={styles.help}>
        Save a pending record, then check and confirm its actual times. Only
        confirmed hours count. This does not create earnings or an invoice.
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
                  pendingManual.jobId ? 'saved linked job' : 'General work'
                }) using its original times and note.`
              : 'Resolve the earlier work action before adding another record.'}
          </Text>
          <TouchableOpacity disabled={work.busy} onPress={retry}>
            <Text style={styles.link}>Retry saved action</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.title}>Work type</Text>
        <TouchableOpacity
          disabled={locked}
          onPress={() => {
            setChoosingJob(!choosingJob);
            if (!choosingJob) {
              void loadJobs();
            }
          }}>
          <Text style={styles.link}>
            {pendingManual
              ? pendingManual.jobId
                ? 'Saved linked job'
                : 'General work'
              : job?.title || 'General work'}{' '}
            · Choose
          </Text>
        </TouchableOpacity>
        {choosingJob && !locked && (
          <View>
            <TouchableOpacity
              onPress={() => {
                setJob(null);
                setChoosingJob(false);
              }}>
              <Text style={styles.link}>General work</Text>
            </TouchableOpacity>
            {jobs.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setJob(item);
                  setChoosingJob(false);
                }}>
                <Text style={styles.link}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            {more && (
              <TouchableOpacity
                onPress={() => {
                  void loadJobs(true);
                }}
                disabled={jobsLoading}>
                <Text style={styles.link}>Load more assigned jobs</Text>
              </TouchableOpacity>
            )}
            {!!jobsError && (
              <TouchableOpacity
                onPress={() => {
                  void loadJobs();
                }}>
                <Text style={styles.error}>{jobsError}</Text>
              </TouchableOpacity>
            )}
            {jobsLoading && <ActivityIndicator />}
          </View>
        )}
        <Text style={styles.help}>
          Start within the last {work.config.manualEntryMaxAgeDays} days.
          Maximum {work.config.hardCapHours} hours per record. Past work must
          finish within your recorded subscription access period.
        </Text>
        <Text style={styles.help}>Reporting timezone</Text>
        <TextInput
          accessibilityLabel="Reporting timezone"
          style={styles.input}
          value={pendingManual?.reportingTimeZone || zone}
          onChangeText={setZone}
          editable={!locked}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <WorkTimeFields
          value={displayed}
          onChange={setValue}
          disabled={locked}
          reportingTimeZone={zoneError ? deviceWorkTimeZone() : displayedZone}
        />
      </View>
      {!!validation && <Text style={styles.error}>{validation}</Text>}
      {!!(error || work.error) && (
        <Text style={styles.error}>{error || work.error}</Text>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        disabled={locked || !work.manualAvailable || !!validation}
        style={[
          styles.button,
          (locked || !work.manualAvailable || !!validation) && styles.disabled,
        ]}
        onPress={save}>
        <Text style={styles.buttonText}>
          {work.busy ? 'Saving…' : 'Save pending record'}
        </Text>
      </TouchableOpacity>
    </WorkRecordLayout>
  );
};
export default ManualWorkEntry;
