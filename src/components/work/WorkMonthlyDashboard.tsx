import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors, Fonts} from '../../constants/Themes';
import {useWorkSessions} from './WorkSessionProvider';
import {useWorkMonthlyReport} from '../../hooks/useWorkMonthlyReport';
import {getMonthLabel} from '../../services/earningsService';
import {workCurrency} from '../../services/workMonthlyReport';
import {formatWorkDuration} from '../../utils/workSessionFlow';

/** The dashboard's month card: hours, earned and records to review, tap for Work Hours. */
export const WorkMonthlyDashboard = () => {
  const work = useWorkSessions();
  const date = new Date(work.now);
  const month = {year: date.getFullYear(), month: date.getMonth()};
  const monthly = useWorkMonthlyReport(month);
  const navigation = useNavigation<any>();
  if (!monthly.available) {
    return null;
  }
  const report = monthly.report;
  const tiles = [
    {
      label: 'Hours',
      value: report ? formatWorkDuration(report.confirmedMs) : '—',
      color: Colors.slateText,
    },
    {
      label: 'Earned',
      value: report ? workCurrency(report.earned) : '—',
      color: '#047857',
    },
    {
      label: 'To review',
      value: report ? String(report.pendingCount) : '—',
      color:
        report && report.pendingCount > 0
          ? Colors.amberDarkText
          : Colors.slateText,
    },
  ];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Work Hours & Earnings, ${getMonthLabel(
        month.month,
      )} ${month.year}`}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('WorkHours', month)}
      style={m.card}>
      <View style={m.header}>
        <Text style={m.month}>
          {getMonthLabel(month.month)} {month.year}
        </Text>
        <Text style={m.link}>Work Hours ›</Text>
      </View>
      <View style={m.tiles}>
        {tiles.map(tile => (
          <View key={tile.label} style={m.tile}>
            <Text style={m.tileLabel}>{tile.label}</Text>
            <Text
              style={[m.tileValue, {color: tile.color}]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {tile.value}
            </Text>
          </View>
        ))}
      </View>
      {!!monthly.error && <Text style={m.error}>{monthly.error}</Text>}
    </TouchableOpacity>
  );
};

const m = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: {fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.slateText},
  link: {fontFamily: Fonts.semiBold, fontSize: 12.5, color: Colors.gradient1},
  tiles: {flexDirection: 'row', gap: 8},
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 10,
  },
  tileLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11,
    color: Colors.secondaryText,
  },
  tileValue: {fontFamily: Fonts.fontBold, fontSize: 16},
  error: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.amberDarkText,
  },
});
