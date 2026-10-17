import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Colors, Fonts} from '../../constants/Themes';
import {
  canStartWork,
  canUseWorkRecords,
  deviceWorkTimeZone,
} from '../../utils/workSessionFlow';
import {cachedDateFormatter, isValidTimeZone} from '../../utils/intlCache';
import {getJobScheduledStart} from '../../utils/workTiming';
import {todayWorkJobs, TodayWorkJob} from '../../utils/workTodayJobs';
import {WorkClockPanel} from './WorkClockPanel';
import {useWorkSessions} from './WorkSessionProvider';
import {WorkButton} from './WorkUI';
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
  const generalDisabled =
    work.busy ||
    work.pending ||
    !work.ready ||
    !!work.current ||
    work.reviews.some(session => session.source === 'clock') ||
    !canStartWork(work.user, work.now);
  return (
    <View style={t.section}>
      <View style={t.header}>
        <Text style={t.heading}>Today</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View all jobs"
          hitSlop={{top: 10, bottom: 10, left: 12, right: 12}}
          onPress={() => navigation.navigate('MyJobs')}>
          <Text style={t.link}>View all jobs</Text>
        </TouchableOpacity>
      </View>
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
        <View style={t.card}>
          <Text style={t.empty}>No confirmed jobs scheduled for today.</Text>
        </View>
      )}
      {jobs.slice(0, 3).map(job => {
        const zone =
          job.scheduleTimeZone && isValidTimeZone(job.scheduleTimeZone)
            ? job.scheduleTimeZone
            : deviceWorkTimeZone();
        const start = getJobScheduledStart(job)!.getTime();
        const [time, period] = jobClock(start, zone);
        const detail = [
          job.location?.name,
          job.expectedHours
            ? `${job.expectedHours} hour${
                job.expectedHours === 1 ? '' : 's'
              } planned`
            : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={job.id} style={t.card}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`View details for ${
                job.title || 'Cleaning job'
              }`}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('JobDetails', {item: job})}
              style={t.jobRow}>
              <View style={t.timeCol}>
                <Text style={t.time}>{time}</Text>
                <Text style={t.period}>{period}</Text>
              </View>
              <View style={s.grow}>
                <Text style={t.jobTitle} numberOfLines={2}>
                  {job.title || 'Cleaning job'}
                </Text>
                {!!detail && (
                  <Text style={t.jobSub} numberOfLines={1}>
                    {detail}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <WorkClockPanel jobId={job.id} compact simple />
          </View>
        );
      })}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Clock in · General work"
        accessibilityState={{disabled: generalDisabled}}
        activeOpacity={0.8}
        disabled={generalDisabled}
        onPress={() => {
          void work.start();
        }}
        style={[t.general, generalDisabled && s.disabled]}>
        <Text style={t.generalText}>+ Clock in · General work</Text>
      </TouchableOpacity>
    </View>
  );
};

/** "7:20" and "PM", split for the time column. */
const jobClock = (time: number, timeZone: string): [string, string] => {
  const parts = cachedDateFormatter('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(time));
  const clock = parts
    .filter(part => part.type !== 'dayPeriod')
    .map(part => part.value)
    .join('')
    .trim();
  const period = parts.find(part => part.type === 'dayPeriod')?.value || '';
  return [clock, period];
};

const t = StyleSheet.create({
  section: {gap: 10},
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  heading: {fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.slateText},
  link: {fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.gradient1},
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  empty: {
    padding: 14,
    fontFamily: Fonts.fontRegular,
    fontSize: 13,
    color: Colors.secondaryText,
  },
  jobRow: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  timeCol: {width: 48, alignItems: 'center'},
  time: {
    fontFamily: Fonts.fontBold,
    fontSize: 15,
    color: Colors.gradient1,
    fontVariant: ['tabular-nums'],
  },
  period: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11,
    color: Colors.secondaryText,
  },
  jobTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.slateText,
  },
  jobSub: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  general: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BBD2FF',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generalText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: Colors.gradient1,
  },
});
