import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useWorkSessions} from './WorkSessionProvider';
import {useWorkMonthlyReport} from '../../hooks/useWorkMonthlyReport';
import {getMonthLabel} from '../../services/earningsService';
import {WorkMonthSummary} from './WorkMonthSummary';
import {workRecordStyles as styles} from './WorkRecordLayout';

export const WorkMonthlyDashboard = () => {
  const work = useWorkSessions();
  const date = new Date(work.now);
  const month = {year: date.getFullYear(), month: date.getMonth()};
  const monthly = useWorkMonthlyReport(month);
  const navigation = useNavigation<any>();
  if (!monthly.available) {
    return null;
  }
  return (
    <View style={styles.monthlyDashboard}>
      <Text style={styles.title}>
        {getMonthLabel(month.month)} {month.year} · Work hours
      </Text>
      <WorkMonthSummary {...monthly} onRetry={monthly.retry} />
      <TouchableOpacity onPress={() => navigation.navigate('WorkHours', month)}>
        <Text style={styles.link}>View monthly hours and earnings</Text>
      </TouchableOpacity>
    </View>
  );
};
