import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useWorkSessions} from './WorkSessionProvider';
import {useWorkMonthlyReport} from '../../hooks/useWorkMonthlyReport';
import {getMonthLabel} from '../../services/earningsService';
import {WorkMonthSummary} from './WorkMonthSummary';
import {workRecordStyles as styles} from './WorkRecordLayout';
import {WorkNavRow, WorkSectionHeader} from './WorkUI';

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
      <WorkSectionHeader
        title="This month"
        hint={`${getMonthLabel(month.month)} ${month.year}`}
      />
      {/* <WorkMonthSummary {...monthly} onRetry={monthly.retry} compact /> */}
      <WorkNavRow
        icon="file-chart-outline"
        title="Work Hours & Earnings"
        subtitle="Work hours, earned amounts and session history"
        onPress={() => navigation.navigate('WorkHours', month)}
      />
    </View>
  );
};
