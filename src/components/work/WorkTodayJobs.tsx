import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Colors} from '../../constants/Themes';
import {
  formatWorkTime,
  canStartWork,
  canUseWorkRecords,
  deviceWorkTimeZone,
} from '../../utils/workSessionFlow';
import {isValidTimeZone} from '../../utils/intlCache';
import {getJobScheduledStart} from '../../utils/workTiming';
import {todayWorkJobs, TodayWorkJob} from '../../utils/workTodayJobs';
import {WorkClockPanel} from './WorkClockPanel';
import {useWorkSessions} from './WorkSessionProvider';
import {WorkButton, WorkSectionHeader} from './WorkUI';
import {workStyles as s} from './workTheme';

/** The dashboard's clock-in entry points use the same assigned jobs as My Jobs. */
export const WorkTodayJobs = () => {
  const work = useWorkSessions();
  const navigation = useNavigation<any>();
  const available = !!work.uid && work.enabled && canUseWorkRecords(work.user);
  const [result, setResult] = useState<{
    uid: string;
    jobs: TodayWorkJob[];
  } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setResult(null);
      setError('');
      if (!available || !work.uid) {
        return;
      }
      const uid = work.uid;
      let focused = true;
      const unsubscribe = firestore()
        .collection('Jobs')
        .where('confirmedCleaner', '==', uid)
        .where('status', '==', 'confirmed')
        .onSnapshot(
          snapshot => {
            if (!focused || auth().currentUser?.uid !== uid) {
              return;
            }
            setError('');
            setResult({
              uid,
              jobs: snapshot.docs.map(
                doc => ({...doc.data(), id: doc.id} as TodayWorkJob),
              ),
            });
          },
          () => {
            if (focused && auth().currentUser?.uid === uid) {
              setError(
                'Could not load today’s jobs. Check your connection and retry.',
              );
            }
          },
        );
      return () => {
        focused = false;
        unsubscribe();
      };
      // A retry intentionally replaces the failed listener.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [available, work.uid, attempt]),
  );
  if (!available) {
    return null;
  }
  const jobs = todayWorkJobs(
    result?.uid === work.uid ? result.jobs : [],
    work.uid!,
    work.now,
  );
  return (
    <View style={{gap: 12}}>
      <WorkSectionHeader
        title="Today’s jobs"
        actionLabel="View all"
        onAction={() => navigation.navigate('MyJobs')}
      />
      {!result && !error && <ActivityIndicator color={Colors.gradient1} />}
      {!!error && (
        <View style={[s.card, s.warnCard]}>
          <Text style={s.error}>{error}</Text>
          <WorkButton
            variant="ghost"
            label="Retry today’s jobs"
            onPress={() => setAttempt(value => value + 1)}
          />
        </View>
      )}
      {!!result && !jobs.length && !error && (
        <View style={s.card}>
          <Text style={s.help}>No confirmed jobs scheduled for today.</Text>
        </View>
      )}
      {jobs.slice(0, 3).map(job => {
        const zone =
          job.scheduleTimeZone && isValidTimeZone(job.scheduleTimeZone)
            ? job.scheduleTimeZone
            : deviceWorkTimeZone();
        return (
          <View key={job.id} style={[s.card, s.cardFlush]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`View details for ${
                job.title || 'Cleaning job'
              }`}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('JobDetails', {item: job})}
              style={{padding: 16, gap: 6}}>
              <Text style={[s.title, {fontSize:14, color: Colors.secondaryText}]} numberOfLines={2}>
                {job.title || 'Cleaning job'}
              </Text>
              <Text style={s.sml}>
                {formatWorkTime(getJobScheduledStart(job)!.getTime(), zone)}
              </Text>
            </TouchableOpacity>
            <WorkClockPanel jobId={job.id} compact simple />
          </View>
        );
      })}
      <WorkButton
        variant="ghost"
        label="Clock in · General work"
        icon="plus-circle-outline"
        disabled={
          work.busy ||
          work.pending ||
          !work.ready ||
          !!work.current ||
          work.reviews.some(session => session.source === 'clock') ||
          !canStartWork(work.user, work.now)
        }
        onPress={() => {
          void work.start();
        }}
      />
    </View>
  );
};
