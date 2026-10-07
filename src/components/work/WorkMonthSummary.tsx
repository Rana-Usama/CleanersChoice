import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import type {WorkMonthlyReport} from '../../services/workMonthlyReport';
import {workCurrency} from '../../services/workMonthlyReport';
import {formatWorkDuration} from '../../utils/workSessionFlow';
import {workRecordStyles as styles} from './WorkRecordLayout';

export const WorkMonthSummary = ({
  report,
  loading,
  error,
  fromCache,
  onRetry,
}: {
  report: WorkMonthlyReport | null;
  loading: boolean;
  error: string;
  fromCache: boolean;
  onRetry(): void;
}) => (
  <View style={styles.card}>
    {loading && (
      <>
        <ActivityIndicator />
        <Text style={styles.help}>Loading monthly hours and invoices…</Text>
      </>
    )}
    {!!error && (
      <TouchableOpacity onPress={onRetry}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.link}>Retry monthly totals</Text>
      </TouchableOpacity>
    )}
    {report && (
      <>
        <Text style={styles.help}>Confirmed hours</Text>
        <Text style={[styles.title, styles.headline]}>
          {formatWorkDuration(report.confirmedMs)}
        </Text>
        <Text style={styles.help}>
          Pending: {formatWorkDuration(report.pendingMs)} ·{' '}
          {report.pendingCount}{' '}
          {report.pendingCount === 1 ? 'record' : 'records'} · not counted
        </Text>
        <Text style={styles.title}>
          Collected: {workCurrency(report.collected)}
        </Text>
        <Text style={styles.help}>
          Effective rate:{' '}
          {report.effectiveRate === null
            ? 'Unavailable until hours are confirmed'
            : `${workCurrency(report.effectiveRate)}/hr`}
        </Text>
        {report.runningMs > 0 && (
          <View>
            <Text style={styles.help}>
              Including current session:{' '}
              {formatWorkDuration(report.includingRunningMs)}
            </Text>
            <Text style={styles.help}>
              Provisional rate:{' '}
              {report.provisionalRate === null
                ? 'Unavailable'
                : `${workCurrency(report.provisionalRate)}/hr`}{' '}
              · running time is not confirmed
            </Text>
          </View>
        )}
        {report.overdue && (
          <Text style={styles.error}>
            A timer reached its stop deadline. Its time is shown as a pending
            estimate until reviewed.
          </Text>
        )}
        {!!report.invalidRecordCount && (
          <Text style={styles.error}>
            Some work records could not be calculated. These totals exclude
            those records.
          </Text>
        )}
        <Text style={styles.help}>
          Collected uses paid invoices in their paid month. Effective rate
          compares that cash with confirmed hours.
        </Text>
      </>
    )}
    {fromCache && (
      <Text style={styles.error}>
        Cached totals may be incomplete. Reconnect to check the latest records
        and invoice payments.
      </Text>
    )}
  </View>
);
