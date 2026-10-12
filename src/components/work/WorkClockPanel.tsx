import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../constants/Themes';
import {useWorkSessions} from './WorkSessionProvider';
import {useWorkTicker} from '../../hooks/useWorkTicker';
import {workStyles as s} from './workTheme';
import {WorkButton, WorkIconTile, WorkPill} from './WorkUI';
import {
  canStartWork,
  canUseWorkRecords,
  formatWorkDuration,
  formatWorkTime,
  workSessionTitle,
  formatWorkTimer,
  workSessionPhase,
} from '../../utils/workSessionFlow';

/** How the job's money is described next to a running session. */
const payLabel = (session: {
  paySnapshot?: {basis: string; hourlyRate: number | null};
}): string | null => {
  const pay = session.paySnapshot;
  if (!pay) {
    return null;
  }
  if (pay.basis === 'hourly' && pay.hourlyRate) {
    return `$${pay.hourlyRate}/hr`;
  }
  if (pay.basis === 'flat') {
    return 'Flat rate';
  }
  if (pay.basis === 'sqft') {
    return 'Per sq ft';
  }
  return null;
};

export const WorkClockPanel = ({
  jobId,
  jobEligible = true,
  compact = false,
  hideIdle = false,
  simple = false,
}: {
  jobId?: string;
  jobEligible?: boolean;
  compact?: boolean;
  hideIdle?: boolean;
  /** Short dashboard footer; detailed timing and pay remain on the job screen. */
  simple?: boolean;
}) => {
  const work = useWorkSessions();
  const navigation = useNavigation<any>();
  const {width, fontScale} = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const session = work.current;
  const active = session?.status === 'active';
  // 1s ticker only while a timer is actually on screen.
  const tick = useWorkTicker(!!active);

  if (
    !canUseWorkRecords(work.user) ||
    (!work.enabled && !work.hasHistory && !work.current)
  ) {
    return null;
  }

  const mine = !!session && (!jobId || session.jobId === jobId);
  const overdue =
    !!session && workSessionPhase(session, work.now) === 'overdue';
  const blocked = work.reviews.some(r => r.source === 'clock');
  const mayStart =
    work.enabled &&
    work.ready &&
    canStartWork(work.user, work.now) &&
    !session &&
    !blocked &&
    jobEligible;
  const busy = work.busy || work.pending;
  if (hideIdle && mayStart && !work.reviews.length && !busy && !work.error) {
    return null;
  }
  const openResolver = () => navigation.navigate('WorkTracking');

  // ---- ClockButton: the five states from the component sheet -------------
  const clockButton = () => {
    if (active && mine) {
      return (
        <WorkButton
          variant="danger"
          icon="stop"
          label="Clock Out"
          disabled={busy}
          onPress={() => {
            void work.stop();
          }}
          style={s.grow}
        />
      );
    }
    if (active && !mine) {
      return (
        <WorkButton
          variant="muted"
          label="Clocked in elsewhere"
          accessibilityLabel="Clocked in on another job"
          style={s.grow}
        />
      );
    }
    if (session && mine) {
      return (
        <WorkButton
          variant="warn"
          icon="alert-outline"
          label="Review times"
          disabled={busy}
          onPress={() => {
            void work.review(session);
          }}
          style={s.grow}
        />
      );
    }
    if (blocked) {
      if (!compact) {
        return null;
      }
      // Still pressable: tapping opens the resolver rather than doing nothing.
      return (
        <WorkButton
          variant="muted"
          icon="alert-outline"
          label="Clock In"
          accessibilityLabel="Clock in, blocked by an unresolved session"
          onPress={openResolver}
          style={s.grow}
        />
      );
    }
    if (mayStart) {
      return (
        <WorkButton
          variant={compact ? 'ghost' : 'primary'}
          icon="play"
          label={jobId ? 'Clock In' : 'Clock in · General work'}
          busy={work.busy}
          onPress={() => {
            void work.start(jobId);
          }}
          style={s.grow}
        />
      );
    }
    return null;
  };

  // Why clock-in is unavailable, in the cleaner's terms.
  const blockedReason = blocked
    ? 'Resolve your open sessions first'
    : !canStartWork(work.user, work.now)
    ? 'Renew your subscription to start new work. Existing records remain available.'
    : !work.enabled
    ? 'New work tracking is currently unavailable.'
    : !jobEligible
    ? 'Clock-in is available when this job is confirmed and assigned to you.'
    : null;

  const pay = session ? payLabel(session) : null;
  const elapsed = session
    ? Math.min(active ? tick : work.now, session.autoStopAt) - session.startedAt
    : 0;

  if (simple) {
    return (
      <View style={styles.simpleFooter}>
        <View style={[s.row, stacked && styles.stackedFooter]}>
          {session && mine && (
            <View style={[s.grow, styles.simpleTimer]}>
              <View style={s.row}>
                {active && !overdue && <View style={styles.liveDot} />}
                <Text style={s.sml}>
                  {active && !overdue ? 'Working' : 'Needs review'}
                </Text>
              </View>
              <Text style={[s.mid, s.mono]}>
                {active
                  ? formatWorkTimer(elapsed)
                  : formatWorkDuration(session.estimatedDurationMs)}
              </Text>
            </View>
          )}
          {clockButton()}
        </View>
        {(!session || !mine) && !!blockedReason && !active && (
          <Text style={s.sml}>{blockedReason}</Text>
        )}
        {!!work.error && (
          <Text accessibilityRole="alert" style={s.error}>
            {work.error}
          </Text>
        )}
        {work.pending && (
          <WorkButton
            variant="ghost"
            label="Retry unfinished work update"
            disabled={work.busy}
            onPress={() => {
              void work.retry();
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        s.card,
        active && mine && s.liveCard,
        !!session && !active && s.warnCard,
        compact && {
          padding: 14,
          borderRadius: 0,
          borderWidth: 0,
          borderTopWidth: 1,
        },
        blocked && !active && s.warnCard,
      ]}>
      {/* ---- running session ------------------------------------------- */}
      {session && mine && (
        <>
          <View style={s.detailRow}>
            <View
              style={[s.row, s.detailPrimary, stacked && {flexBasis: '100%'}]}>
              {active ? (
                <View style={styles.liveDot} />
              ) : (
                <WorkIconTile
                  icon="alert-outline"
                  color={Colors.amberDarkText}
                  bg={Colors.amberOverlay10}
                />
              )}
              <View style={s.grow}>
                <Text style={s.eyebrow}>
                  {active
                    ? overdue
                      ? 'Past its stop time'
                      : 'Currently working'
                    : 'Needs your attention'}
                </Text>
                <Text style={s.body} numberOfLines={2}>
                  {workSessionTitle(session)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.timerBlock,
                stacked && {alignItems: 'flex-start'},
              ]}>
              <Text style={[s.mid, s.mono, active && {fontSize: 24}]}>
                {active
                  ? formatWorkTimer(elapsed)
                  : formatWorkDuration(session.estimatedDurationMs)}
              </Text>
              <Text style={s.sml}>
                {active
                  ? `since ${formatWorkTime(
                      session.startedAt,
                      session.reportingTimeZone,
                    )}`
                  : 'estimated'}
              </Text>
            </View>
          </View>

          {active && !overdue && (
            <View style={[s.inner, s.rowBetween]}>
              <Text style={[s.sml, s.detailPrimary]}>
                {session.expectedEndAt
                  ? `Expected finish ${formatWorkTime(
                      session.expectedEndAt,
                      session.reportingTimeZone,
                    )}`
                  : `Stops by ${formatWorkTime(
                      session.autoStopAt,
                      session.reportingTimeZone,
                    )}`}
              </Text>
              {!!pay && <WorkPill tone="active" label={pay} />}
            </View>
          )}

          <Text style={s.sml}>
            {active
              ? overdue
                ? 'Checking the stop deadline. These hours need review.'
                : 'Time counts once you clock out.'
              : 'Confirm actual times before these hours count.'}
          </Text>
        </>
      )}

      {/* ---- idle / blocked -------------------------------------------- */}
      {(!session || !mine) && (
        <>
          <View style={s.row}>
            <WorkIconTile
              icon={blocked ? 'alert-outline' : 'clock-outline'}
              color={blocked ? Colors.amberDarkText : Colors.gradient1}
              bg={blocked ? Colors.amberOverlay10 : Colors.blueOverlay10}
              size={24}
            />
            <View style={s.grow}>
              <Text style={s.title}>
                {blocked
                  ? `${work.reviews.length} ${
                      work.reviews.length === 1
                        ? 'session needs'
                        : 'sessions need'
                    } review`
                  : compact
                  ? 'Work on this job'
                  : 'Ready to work?'}
              </Text>
              {!compact && (
                <Text style={s.sml}>
                  {blockedReason ?? 'Clock out to confirm your work hours.'}
                </Text>
              )}
            </View>
          </View>
          {compact && !!blockedReason && (
            <Text style={s.sml}>{blockedReason}</Text>
          )}
        </>
      )}

      <View style={s.row}>{clockButton()}</View>
      {!compact && work.reviews.length > 0 && (
        <WorkButton
          variant="warn"
          label={`Review ${work.reviews.length} ${
            work.reviews.length === 1 ? 'session' : 'sessions'
          }`}
          onPress={openResolver}
        />
      )}

      {/* Planned finish is only offered for general work with no end in sight. */}
      {active &&
        mine &&
        !session.jobId &&
        session.expectedEndAt === null &&
        !overdue && (
          <TouchableOpacity
            hitSlop={{top: 6, bottom: 6, left: 12, right: 12}}
            disabled={busy}
            onPress={work.planFinish}>
            <Text style={s.link}>Add a planned finish</Text>
          </TouchableOpacity>
        )}

      {!compact && (
        <TouchableOpacity
          accessibilityRole="button"
          hitSlop={{top: 6, bottom: 6, left: 12, right: 12}}
          onPress={() => navigation.navigate('WorkTracking')}>
          {/* <Text style={s.link}>
            Work history
            {work.reviews.length ? ` · ${work.reviews.length} to review` : ''}
          </Text> */}
        </TouchableOpacity>
      )}

      {work.reminderUnavailable && active && (
        <Text style={s.sml}>
          The phone reminder could not be scheduled. Check your timer in the
          app; the server stop deadline still applies.
        </Text>
      )}
      {!!work.error && (
        <Text style={s.error} accessibilityRole="alert">
          {work.error}
        </Text>
      )}
      {work.pending && (
        <WorkButton
          variant="ghost"
          label="Retry unfinished work update"
          disabled={work.busy}
          onPress={() => {
            void work.retry();
          }}
        />
      )}
      {work.busy && <ActivityIndicator color={Colors.gradient1} />}
    </View>
  );
};

const styles = {
  simpleFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: 10,
  },
  simpleTimer: {gap: 4},
  stackedFooter: {
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  timerBlock: {alignItems: 'flex-end' as const},
};
