import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {useWorkSessions} from './WorkSessionProvider';
import {useWorkTicker} from '../../hooks/useWorkTicker';
import {
  canUseWorkRecords,
  formatWorkTime,
  workSessionTitle,
  formatWorkTimer,
} from '../../utils/workSessionFlow';

/**
 * The persistent work bar that sits directly above the bottom tabs, so a
 * running timer is visible and stoppable from any tab - and an unreviewed
 * session keeps saying so until it is resolved.
 *
 * Renders nothing when there is no active session and nothing to review, which
 * is the normal state; it must not take up space then.
 */
export const ActiveSessionBanner = () => {
  const work = useWorkSessions();
  const navigation = useNavigation<any>();
  const {fontScale} = useWindowDimensions();
  const session = work.current;
  const active = session?.status === 'active';
  const tick = useWorkTicker(!!active);
  const reviews = work.reviews.length;

  if (!canUseWorkRecords(work.user)) {
    return null;
  }

  if (active && session) {
    const elapsed = Math.min(tick, session.autoStopAt) - session.startedAt;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Working on ${workSessionTitle(
          session,
        )}. Open work tracking.`}
        activeOpacity={0.9}
        style={[styles.bar, styles.live, fontScale > 1.2 && {flexWrap: 'wrap'}]}
        onPress={() => navigation.navigate('WorkTracking')}>
        <View style={styles.dot} />
        <View style={[styles.grow, fontScale > 1.2 && {flexBasis: '85%'}]}>
          <Text style={styles.title} numberOfLines={1}>
            {workSessionTitle(session)}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            Clocked in{' '}
            {formatWorkTime(session.startedAt, session.reportingTimeZone)}
          </Text>
        </View>
        <Text style={styles.timer}>{formatWorkTimer(elapsed)}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Clock out"
          disabled={work.busy || work.pending}
          style={[
            styles.stop,
            (work.busy || work.pending) && styles.stopDisabled,
          ]}
          onPress={() => {
            void work.stop();
          }}>
          <MaterialCommunityIcons name="stop" size={18} color={Colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  if (reviews > 0) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.9}
        style={[styles.bar, styles.warn, {flexWrap: 'wrap'}]}
        onPress={() => navigation.navigate('WorkTracking')}>
        <MaterialCommunityIcons
          name="alert-outline"
          size={18}
          color={Colors.amberBorder}
        />
        <View style={[styles.grow, {flexBasis: 150}]}>
          <Text style={styles.title} numberOfLines={1}>
            {reviews} {reviews === 1 ? 'session needs' : 'sessions need'} review
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            Not counted until you confirm
          </Text>
        </View>
        <View style={styles.action}>
          <Text style={styles.actionText}>Review</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  live: {backgroundColor: Colors.slateText},
  warn: {backgroundColor: Colors.amberDarkText},
  grow: {flex: 1, minWidth: 0},
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  title: {fontFamily: Fonts.semiBold, fontSize: 13.5, color: Colors.white},
  sub: {
    fontFamily: Fonts.fontMedium,
    fontSize: 11.8,
    marginTop: 1,
    color: Colors.whiteOverlay90,
  },
  timer: {
    fontFamily: Fonts.fontBold,
    fontSize: 16,
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  stop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red500,
  },
  stopDisabled: {opacity: 0.5},
  action: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.whiteOverlay20,
  },
  actionText: {fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white},
});
