import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../routers/StackNavigator';
import {
  WorkRecordLayout,
  workRecordStyles as styles,
} from '../../../components/work/WorkRecordLayout';
import {WorkMonthSummary} from '../../../components/work/WorkMonthSummary';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {useWorkMonthlyReport} from '../../../hooks/useWorkMonthlyReport';
import {
  getMonthLabel,
  parseInvoiceAmount,
} from '../../../services/earningsService';
import {workCurrency} from '../../../services/workMonthlyReport';
import {invoiceToFormData} from '../../../services/invoiceService';
import type {Invoice} from '../../../types/invoice';
import {
  deviceWorkTimeZone,
  formatWorkDuration,
} from '../../../utils/workSessionFlow';
import {
  detailedWorkTime,
  workStatusLabel,
} from '../../../utils/workSessionEntry';
import {shiftWorkMonth, WorkMonth} from '../../../utils/workMonth';

const PAGE = 25;
type Filter = 'all' | 'confirmed' | 'needsReview';
const WorkHours = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'WorkHours'>) => {
  const work = useWorkSessions();
  const [selected, setSelected] = useState<WorkMonth>(() => {
    const date = new Date(work.now);
    const value = route.params;
    return value &&
      Number.isInteger(value.year) &&
      value.year >= 1970 &&
      value.year < 9999 &&
      Number.isInteger(value.month) &&
      value.month >= 0 &&
      value.month < 12
      ? value
      : {year: date.getFullYear(), month: date.getMonth()};
  });
  const monthly = useWorkMonthlyReport(selected);
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [shownJobs, setShownJobs] = useState(PAGE);
  const [showPaid, setShowPaid] = useState(false);
  const [shownPaid, setShownPaid] = useState(PAGE);
  const report = monthly.report;
  useEffect(() => {
    setShown(PAGE);
    setShownJobs(PAGE);
    setShownPaid(PAGE);
    setShowPaid(false);
  }, [selected.year, selected.month, filter, work.uid]);
  const openInvoice = (invoice: Invoice) =>
    navigation.navigate('InvoicePreview', {
      invoice,
      formData: invoiceToFormData(invoice),
      jobItem: {id: invoice.jobId, jobId: invoice.customerId},
      viewOnly: true,
      paymentActionsDisabled: true,
    });
  const records =
    report?.records.filter(
      item =>
        filter === 'all' ||
        (filter === 'confirmed' ? item.confirmedMs > 0 : item.pendingMs > 0),
    ) || [];
  return (
    <WorkRecordLayout
      title="Monthly hours & earnings"
      onBack={() => navigation.goBack()}>
      <View style={[styles.card, styles.monthSelector]}>
        <TouchableOpacity
          accessibilityLabel="Previous month"
          disabled={selected.year === 1970 && selected.month === 0}
          onPress={() => setSelected(value => shiftWorkMonth(value, -1))}>
          <Text style={styles.link}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Choose report month"
          onPress={() => setPicker(true)}>
          <Text style={styles.title}>
            {getMonthLabel(selected.month)} {selected.year}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Next month"
          disabled={selected.year === 9998 && selected.month === 11}
          onPress={() => setSelected(value => shiftWorkMonth(value, 1))}>
          <Text style={styles.link}>Next</Text>
        </TouchableOpacity>
      </View>
      {!monthly.available ? (
        <Text style={styles.help}>
          Monthly tracking is available to eligible cleaners when tracking is
          enabled or existing work history is available.
        </Text>
      ) : (
        <>
          <WorkMonthSummary {...monthly} onRetry={monthly.retry} />
          {report && (
            <>
              <Text style={styles.help}>
                Work uses each record’s saved timezone
                {report.reportingZones.length
                  ? `: ${report.reportingZones.join(', ')}`
                  : ''}
                . Overnight hours are split between months. Totals and rates use
                exact elapsed time; displayed hours use whole minutes. Invoice
                paid months use your device timezone ({deviceWorkTimeZone()}),
                as in Earnings.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkTracking')}>
                <Text style={styles.link}>
                  Manage timers, review pending work, or add past work
                </Text>
              </TouchableOpacity>
              <Text style={styles.title}>By job</Text>
              <Text style={styles.help}>
                Each paid invoice counts once for its job. Money paid this month
                may relate to work in another month.
              </Text>
              {report.jobs.length === 0 && (
                <Text style={styles.help}>
                  No work or paid invoices for this month.
                </Text>
              )}
              {report.jobs.slice(0, shownJobs).map(job => (
                <View key={job.key} style={styles.card}>
                  <Text style={styles.title}>{job.title}</Text>
                  <Text style={styles.help}>
                    {formatWorkDuration(job.confirmedMs)} confirmed ·{' '}
                    {workCurrency(job.collected)} collected
                  </Text>
                  {job.pendingMs > 0 && (
                    <Text style={styles.help}>
                      {formatWorkDuration(job.pendingMs)} pending · not counted
                    </Text>
                  )}
                  {job.runningMs > 0 && (
                    <Text style={styles.help}>
                      {formatWorkDuration(job.runningMs)} running · not counted
                    </Text>
                  )}
                  <Text style={styles.help}>
                    {job.paidInvoiceCount} paid{' '}
                    {job.paidInvoiceCount === 1 ? 'invoice' : 'invoices'}
                  </Text>
                </View>
              ))}
              {shownJobs < report.jobs.length && (
                <TouchableOpacity
                  onPress={() => setShownJobs(value => value + PAGE)}>
                  <Text style={styles.link}>Show more jobs</Text>
                </TouchableOpacity>
              )}
              <View style={styles.card}>
                <Text style={styles.title}>Invoice follow-up</Text>
                <Text style={styles.help}>
                  Outstanding invoices, all dates:{' '}
                  {workCurrency(report.outstandingTotal)} ·{' '}
                  {report.outstandingInvoices.length}{' '}
                  {report.outstandingInvoices.length === 1
                    ? 'invoice'
                    : 'invoices'}
                </Text>
                <Text style={styles.help}>
                  {report.jobsWithoutInvoice.length}{' '}
                  {report.jobsWithoutInvoice.length === 1
                    ? 'job has'
                    : 'jobs have'}{' '}
                  confirmed hours this month and no saved invoice. General work
                  does not imply a charge. A job with any saved invoice is
                  excluded from this count.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkTracking')}>
                  <Text style={styles.link}>View existing invoices</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setShowPaid(value => !value)}>
                <Text style={styles.link}>
                  {showPaid ? 'Hide' : 'View'} paid invoices for this month (
                  {report.paidInvoices.length})
                </Text>
              </TouchableOpacity>
              {showPaid &&
                report.paidInvoices
                  .slice(0, shownPaid)
                  .map((invoice, index) => (
                    <TouchableOpacity
                      key={invoice.id || index}
                      style={styles.card}
                      onPress={() => openInvoice(invoice)}>
                      <Text style={styles.title}>
                        {invoice.invoiceId} ·{' '}
                        {workCurrency(parseInvoiceAmount(invoice.price))}
                      </Text>
                      <Text style={styles.help}>
                        {invoice.jobPostName || invoice.toName}
                      </Text>
                      <Text style={styles.link}>View paid invoice</Text>
                    </TouchableOpacity>
                  ))}
              {showPaid && shownPaid < report.paidInvoices.length && (
                <TouchableOpacity
                  onPress={() => setShownPaid(value => value + PAGE)}>
                  <Text style={styles.link}>Show more paid invoices</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.title}>Work records in this month</Text>
              <View style={styles.filters}>
                {(['all', 'confirmed', 'needsReview'] as Filter[]).map(
                  value => (
                    <TouchableOpacity
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{selected: filter === value}}
                      onPress={() => setFilter(value)}>
                      <Text
                        style={filter === value ? styles.title : styles.link}>
                        {value === 'all'
                          ? 'All'
                          : value === 'confirmed'
                          ? 'Confirmed'
                          : 'Pending'}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
              {records.length === 0 && (
                <Text style={styles.help}>
                  No{' '}
                  {filter === 'all'
                    ? 'work'
                    : filter === 'confirmed'
                    ? 'confirmed'
                    : 'pending'}{' '}
                  records for this month.
                </Text>
              )}
              {records.slice(0, shown).map(item => (
                <TouchableOpacity
                  key={item.session.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('WorkSessionDetails', {
                      sessionId: item.session.id,
                    })
                  }>
                  <Text style={styles.title}>
                    {item.session.jobSnapshot?.title || 'General work'}
                  </Text>
                  <Text style={styles.help}>
                    {item.pendingMs > 0
                      ? 'Pending confirmation'
                      : workStatusLabel(item.session.status)}{' '}
                    ·{' '}
                    {formatWorkDuration(
                      item.confirmedMs || item.pendingMs || item.runningMs,
                    )}{' '}
                    in this month
                  </Text>
                  <Text style={styles.help}>
                    {detailedWorkTime(
                      item.session.startedAt,
                      item.session.reportingTimeZone,
                    )}{' '}
                    →{' '}
                    {item.session.endedAt === null
                      ? 'Open'
                      : detailedWorkTime(
                          item.session.endedAt,
                          item.session.reportingTimeZone,
                        )}{' '}
                    · {item.session.reportingTimeZone}
                  </Text>
                  {item.crossesMonth && (
                    <Text style={styles.help}>
                      Only this month’s part is included above. Record details
                      show the full interval.
                    </Text>
                  )}
                  <Text style={styles.link}>View times and history</Text>
                </TouchableOpacity>
              ))}
              {shown < records.length && (
                <TouchableOpacity
                  onPress={() => setShown(value => value + PAGE)}>
                  <Text style={styles.link}>Show more work records</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}
      <DatePicker
        modal
        mode="date"
        open={picker}
        date={new Date(selected.year, selected.month, 1, 12)}
        minimumDate={new Date(1970, 0, 1)}
        maximumDate={new Date(9998, 11, 31)}
        onCancel={() => setPicker(false)}
        onConfirm={date => {
          setSelected({year: date.getFullYear(), month: date.getMonth()});
          setPicker(false);
        }}
      />
    </WorkRecordLayout>
  );
};
export default WorkHours;
