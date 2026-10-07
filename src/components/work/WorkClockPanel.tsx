import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {Colors, Fonts} from '../../constants/Themes';
import {useWorkSessions} from './WorkSessionProvider';
import {
  canStartWork,
  canUseWorkRecords,
  formatWorkDuration,
  formatWorkTime,
  workSessionPhase,
} from '../../utils/workSessionFlow';

export const WorkClockPanel = ({
  jobId,
  jobEligible = true,
  compact = false,
}: {
  jobId?: string;
  jobEligible?: boolean;
  compact?: boolean;
}) => {
  const work = useWorkSessions();
  const navigation = useNavigation<any>();
  if (
    !canUseWorkRecords(work.user) ||
    (!work.enabled && !work.hasHistory && !work.current)
  ) {
    return null;
  }
  const session = work.current;
  const mine = !!session && (!jobId || session.jobId === jobId);
  const active = session?.status === 'active';
  const overdue =
    !!session && workSessionPhase(session, work.now) === 'overdue';
  const blocked = work.reviews.some(s => s.source === 'clock');
  const mayStart =
    work.enabled &&
    work.ready &&
    canStartWork(work.user, work.now) &&
    !session &&
    !blocked &&
    jobEligible;
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="clock-outline"
          color={Colors.gradient1}
          size={22}
        />
        <Text style={styles.title}>
          {active
            ? mine
              ? 'Working'
              : 'Working elsewhere'
            : blocked
            ? 'Work needs review'
            : 'Work hours'}
        </Text>
      </View>
      {session && (
        <>
          <Text style={styles.text}>
            {session.jobSnapshot?.title || 'General work'}
          </Text>
          <Text style={styles.duration}>
            {formatWorkDuration(
              active
                ? Math.min(work.now, session.autoStopAt) - session.startedAt
                : session.estimatedDurationMs,
            )}
            <Text style={styles.caption}>
              {active ? ' · running' : ' · pending'}
            </Text>
          </Text>
          <Text style={styles.help}>
            {active
              ? overdue
                ? 'Checking the stop deadline. These hours need review.'
                : `Stops by ${formatWorkTime(
                    session.autoStopAt,
                    session.reportingTimeZone,
                  )}`
              : 'Confirm actual times before these hours count.'}
          </Text>
          {active && mine && (
            <TouchableOpacity
              style={styles.primary}
              disabled={work.busy || work.pending}
              onPress={() => {
                void work.stop();
              }}>
              <Text style={styles.white}>Clock out</Text>
            </TouchableOpacity>
          )}
          {active &&
            mine &&
            !session.jobId &&
            session.expectedEndAt === null &&
            !overdue && (
              <TouchableOpacity
                style={styles.link}
                disabled={work.busy || work.pending}
                onPress={work.planFinish}>
                <Text style={styles.linkText}>Add a planned finish</Text>
              </TouchableOpacity>
            )}
          {!active && mine && (
            <TouchableOpacity
              style={styles.primary}
              disabled={work.busy || work.pending}
              onPress={() => {
                void work.review(session);
              }}>
              <Text style={styles.white}>Review times</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      {!session && (
        <>
          <Text style={styles.help}>
            {!canStartWork(work.user, work.now)
              ? 'Renew your subscription to start new work. Existing records remain available.'
              : !work.enabled
              ? 'New work tracking is currently unavailable.'
              : !jobEligible
              ? 'Clock-in is available when this job is confirmed and assigned to you.'
              : 'Track your time. Hours count after you finish; collected money comes from paid invoices.'}
          </Text>
          {mayStart && (
            <TouchableOpacity
              style={styles.primary}
              disabled={work.busy || work.pending}
              onPress={() => {
                void work.start(jobId);
              }}>
              <Text style={styles.white}>
                {jobId ? 'Clock in for this job' : 'Clock in · General work'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
      {!compact && (
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('WorkTracking')}>
          <Text style={styles.linkText}>
            Work history
            {work.reviews.length ? ` · ${work.reviews.length} to review` : ''}
          </Text>
        </TouchableOpacity>
      )}
      {work.reminderUnavailable && active && (
        <Text style={styles.help}>
          The phone reminder could not be scheduled. Check your timer in the
          app; the server stop deadline still applies.
        </Text>
      )}
      {!!work.error && (
        <Text style={styles.error} accessibilityRole="alert">
          {work.error}
        </Text>
      )}
      {work.pending && (
        <TouchableOpacity
          style={styles.secondary}
          disabled={work.busy}
          onPress={() => {
            void work.retry();
          }}>
          <Text style={styles.linkText}>Retry unfinished work update</Text>
        </TouchableOpacity>
      )}
      {work.busy && <ActivityIndicator color={Colors.gradient1} />}
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    gap: 10,
  },
  compact: {margin: 12, padding: 14},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {fontFamily: Fonts.semiBold, color: Colors.slateText, fontSize: 17},
  text: {color: Colors.slateText, fontSize: 15, fontFamily: Fonts.fontMedium},
  duration: {fontFamily: Fonts.fontBold, fontSize: 28, color: Colors.gradient1},
  caption: {fontSize: 13, color: Colors.secondaryText},
  help: {color: Colors.secondaryText, fontSize: 13, lineHeight: 20},
  primary: {
    padding: 13,
    borderRadius: 10,
    backgroundColor: Colors.gradient1,
    alignItems: 'center',
  },
  white: {color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 15},
  link: {paddingVertical: 8},
  linkText: {color: Colors.gradient1, fontFamily: Fonts.semiBold, fontSize: 14},
  error: {color: Colors.amberDarkText, fontSize: 13, lineHeight: 20},
  secondary: {padding: 12, borderRadius: 10, backgroundColor: Colors.blueBg50},
});
