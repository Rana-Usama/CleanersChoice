import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../constants/Themes';
import type {WorkMonthlyReport} from '../../services/workMonthlyReport';
import {workCurrency} from '../../services/workMonthlyReport';
import {formatWorkDuration} from '../../utils/workSessionFlow';
import {workStyles as s} from './workTheme';
import {WorkIconTile} from './WorkUI';

/**
 * Monthly work hours, separate pending hours and earned amounts.
 *
 * `compact` uses the dashboard tiles; the full form includes the month picker.
 */
export const WorkMonthSummary = ({
  report,
  loading,
  error,
  fromCache,
  onRetry,
  compact = false,
  monthLabel,
  onPickMonth,
  onPrevMonth,
  onNextMonth,
  prevDisabled,
  nextDisabled,
}: {
  report: WorkMonthlyReport | null;
  loading: boolean;
  error: string;
  fromCache: boolean;
  onRetry(): void;
  compact?: boolean;
  monthLabel?: string;
  onPickMonth?: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) => {
  const {fontScale} = useWindowDimensions();
  const tile = [s.tile, fontScale > 1.2 && {flexBasis: '100%' as const}];
  return (
    <View style={compact ? {gap: 12} : s.card}>
      {loading && (
        <View style={s.row}>
          <ActivityIndicator color={Colors.gradient1} />
          <Text style={[s.help, s.grow]}>Loading work hours and earnings…</Text>
        </View>
      )}

      {!!error && !report && (
        <TouchableOpacity accessibilityRole="button" onPress={onRetry}>
          <Text style={s.error}>{error}</Text>
          <Text style={s.link}>Retry monthly totals</Text>
        </TouchableOpacity>
      )}

      {report && compact && (
        <>
          <View style={s.tileRow}>
            <View style={tile}>
              <View style={s.row}>
                <WorkIconTile
                  icon="clock-outline"
                  color={Colors.gradient1}
                  bg={Colors.blueBg200}
                />
                <Text style={[s.sml, s.grow]}>Work hours</Text>
              </View>
              <Text style={[s.mid, {marginTop: 6}]}>
                {formatWorkDuration(report.confirmedMs)}
              </Text>
              <Text style={s.sml}>Confirmed hours</Text>
              {report.pendingCount > 0 && (
                <Text style={[s.sml, {color: Colors.amberDarkText}]}>
                  + {formatWorkDuration(report.pendingMs)} pending review
                </Text>
              )}
              {report.runningMs > 0 && (
                <Text style={s.sml}>
                  {formatWorkDuration(report.includingRunningMs)} incl. running
                </Text>
              )}
            </View>
            <View style={tile}>
              <View style={s.row}>
                <WorkIconTile
                  icon="cash"
                  color={Colors.success}
                  bg={Colors.greenBg100}
                />
                <Text style={[s.sml, s.grow]}>Earned</Text>
              </View>
              <Text style={[s.mid, {marginTop: 6}]}>
                {workCurrency(report.earned)}
              </Text>
              <Text style={s.sml}>
                Confirmed hourly work and completed jobs
              </Text>
            </View>
          </View>
          {/* {report.unratedMs > 0 && (
            <Text style={s.sml}>
              {formatWorkDuration(report.unratedMs)} has no saved rate — not
              included in earned
            </Text>
          )} */}
          {report.overdue && (
            <Text style={s.error}>
              A timer reached its stop deadline. Its time is pending until
              reviewed.
            </Text>
          )}
          {!!report.invalidRecordCount && (
            <Text style={s.error}>
              Some work records could not be calculated. These totals exclude
              those records.
            </Text>
          )}
        </>
      )}

      {report && !compact && (
        <>
          {/*
            One month control for the whole screen. There used to be three:
            an "OCTOBER 2026" eyebrow, an "October" picker pill beside it, and
            a separate stepper card underneath repeating "October 2026".
          */}
          <View style={s.monthRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Previous"
              activeOpacity={0.7}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={[s.stepper, prevDisabled && s.disabled]}
              disabled={prevDisabled || !onPrevMonth}
              onPress={onPrevMonth}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose report month"
              activeOpacity={0.8}
              style={[s.row, s.grow, {justifyContent: 'center'}]}
              disabled={!onPickMonth}
              onPress={onPickMonth}>
              <Text style={s.monthTitle}>{monthLabel}</Text>
              {!!onPickMonth && (
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color={Colors.secondaryText}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Next"
              activeOpacity={0.7}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={[s.stepper, nextDisabled && s.disabled]}
              disabled={nextDisabled || !onNextMonth}
              onPress={onNextMonth}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
          </View>

          <Text style={s.hero}>{formatWorkDuration(report.confirmedMs)}</Text>

          {/* One caption, not two lines both ending in "6 sessions". */}
          <View style={[s.row, {flexWrap: 'wrap'}]}>
            <Text style={s.sml}>
              Confirmed hours · {report.records.length}{' '}
              {report.records.length === 1 ? 'session' : 'sessions'}
            </Text>
            {report.pendingCount > 0 && (
              <View
                style={[
                  s.pill,
                  {
                    backgroundColor: Colors.amberBg50,
                    borderColor: Colors.amberBorder,
                  },
                ]}>
                <Text style={[s.pillText, {color: Colors.amberDarkText}]}>
                  {report.pendingCount} pending · est.{' '}
                  {formatWorkDuration(report.pendingMs)}
                </Text>
              </View>
            )}
          </View>

          <View style={[s.divider, {marginVertical: 6}]} />

          <View style={s.rowBetween}>
            <Text style={s.sml}>Earned</Text>
            <Text style={[s.statValue, s.grow, {textAlign: 'right'}]}>
              {workCurrency(report.earned)}
            </Text>
          </View>

          {/* {report.unratedMs > 0 && (
            <View style={s.row}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={15}
                color={Colors.secondaryText}
              />
              <Text style={[s.sml, s.grow]}>
                {formatWorkDuration(report.unratedMs)} has no saved rate — not
                included in earned
              </Text>
            </View>
          )} */}

          {report.runningMs > 0 && (
            <View style={s.inner}>
              <Text style={s.sml}>
                Including current session:{' '}
                {formatWorkDuration(report.includingRunningMs)}
              </Text>
            </View>
          )}

          {report.overdue && (
            <Text style={s.error}>
              A timer reached its stop deadline. Its time is shown as a pending
              estimate until reviewed.
            </Text>
          )}

          {!!report.invalidRecordCount && (
            <Text style={s.error}>
              Some work records could not be calculated. These totals exclude
              those records.
            </Text>
          )}
        </>
      )}

      {!!error && !!report && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onRetry}
          style={s.noticeRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={15}
            color={Colors.amberDarkText}
          />
          <Text style={[s.sml, s.grow, {color: Colors.amberDarkText}]}>
            {error}
          </Text>
          <Text style={[s.pillText, {color: Colors.gradient1}]}>
            Retry monthly totals
          </Text>
        </TouchableOpacity>
      )}

      {fromCache && (
        <Text style={s.error}>
          Cached totals may be incomplete. Reconnect to check the latest records
          and earnings.
        </Text>
      )}
    </View>
  );
};
