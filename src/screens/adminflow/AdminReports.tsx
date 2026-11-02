import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import moment from 'moment';
import NotFound from '../../components/NotFound';
import {Colors, Fonts} from '../../constants/Themes';
import useIsAdmin from '../../hooks/useIsAdmin';
import {showToast} from '../../utils/ToastMessage';
import {
  fetchReportedJob,
  fetchReports,
  updateReportStatus,
} from '../../services/reportService';
import {
  JobReport,
  REPORT_REASON_LABELS,
  ReportStatus,
} from '../../types/report';

type FilterKey = 'open' | 'resolved' | 'dismissed' | 'all';

/** Which row is busy AND which action — so only that button shows a spinner. */
type BusyAction = 'view' | ReportStatus;

const FILTERS: {key: FilterKey; label: string}[] = [
  {key: 'open', label: 'Open'},
  {key: 'resolved', label: 'Resolved'},
  {key: 'dismissed', label: 'Dismissed'},
  {key: 'all', label: 'All'},
];

const STATUS_STYLE: Record<ReportStatus, {bg: string; fg: string; label: string}> = {
  open: {bg: Colors.amberBg50, fg: Colors.amberDarkText, label: 'Open'},
  resolved: {bg: Colors.successBg, fg: Colors.successText, label: 'Resolved'},
  dismissed: {bg: Colors.gray50, fg: Colors.secondaryText, label: 'Dismissed'},
};

const formatDate = (value: any): string => {
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : typeof value?.seconds === 'number'
      ? new Date(value.seconds * 1000)
      : null;
  return date ? moment(date).format('MMM DD, YYYY · h:mm A') : 'Just now';
};

const AdminReports = ({navigation}: any) => {
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<JobReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('open');
  const [busy, setBusy] = useState<{id: string; action: BusyAction} | null>(
    null,
  );

  const loadReports = useCallback(async () => {
    try {
      setReports(await fetchReports());
    } catch (error) {
      console.log('[AdminReports] fetch failed:', error);
      showToast({
        type: 'error',
        title: 'Unable to load reports',
        message: 'Pull down to try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) loadReports();
    }, [isAdmin, loadReports]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      open: 0,
      resolved: 0,
      dismissed: 0,
      all: reports.length,
    };
    reports.forEach(report => {
      if (report.status in base) base[report.status as FilterKey] += 1;
    });
    return base;
  }, [reports]);

  const filtered = useMemo(
    () =>
      filter === 'all' ? reports : reports.filter(r => r.status === filter),
    [reports, filter],
  );

  const setStatus = async (report: JobReport, status: ReportStatus) => {
    if (busy) return;
    setBusy({id: report.id, action: status});
    try {
      await updateReportStatus(report.id, status);
      setReports(current =>
        current.map(r => (r.id === report.id ? {...r, status} : r)),
      );
      showToast({
        type: 'success',
        title: 'Report updated',
        message: `Marked as ${STATUS_STYLE[status].label.toLowerCase()}.`,
      });
    } catch (error) {
      console.log('[AdminReports] status update failed:', error);
      showToast({
        type: 'error',
        title: 'Unable to update report',
        message: 'Please try again.',
      });
    } finally {
      setBusy(null);
    }
  };

  const viewJob = async (report: JobReport) => {
    if (busy) return;
    setBusy({id: report.id, action: 'view'});
    try {
      const job = await fetchReportedJob(report.jobId);
      if (!job) {
        showToast({
          type: 'info',
          title: 'Job not found',
          message: 'This job has already been deleted.',
        });
        return;
      }
      navigation.navigate('JobDetails', {item: job});
    } catch (error) {
      console.log('[AdminReports] job lookup failed:', error);
      showToast({type: 'error', title: 'Unable to open job', message: 'Please try again.'});
    } finally {
      setBusy(null);
    }
  };

  const renderItem = ({item}: {item: JobReport}) => {
    const status = STATUS_STYLE[item.status] ?? STATUS_STYLE.open;
    const rowAction = busy?.id === item.id ? busy.action : null;
    // Lock every row while any action runs; the guards above enforce one at a time.
    const locked = busy !== null;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.reasonPill}>
            <Feather name="flag" size={12} color={Colors.dangerRed} />
            <Text style={styles.reasonText} numberOfLines={1}>
              {REPORT_REASON_LABELS[item.reason] ?? item.reason}
            </Text>
          </View>
          <View style={[styles.statusPill, {backgroundColor: status.bg}]}>
            <Text style={[styles.statusText, {color: status.fg}]}>
              {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.jobTitle || 'Untitled job'}
        </Text>

        <View style={styles.metaRow}>
          <Feather name="user" size={13} color={Colors.secondaryText} />
          <Text style={styles.metaText} numberOfLines={1}>
            Customer: {item.reportedUserName || item.reportedUserId || 'Unknown'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="briefcase" size={13} color={Colors.secondaryText} />
          <Text style={styles.metaText} numberOfLines={1}>
            Reported by: {item.reporterName || 'Cleaner'}
            {item.reporterEmail ? ` · ${item.reporterEmail}` : ''}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={Colors.secondaryText} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>

        {!!item.details && (
          <Text style={styles.details}>“{item.details}”</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            disabled={locked}
            onPress={() => viewJob(item)}
            style={[styles.actionBtn, styles.viewBtn]}>
            {rowAction === 'view' ? (
              <ActivityIndicator size="small" color={Colors.gradient1} />
            ) : (
              <Feather name="external-link" size={15} color={Colors.gradient1} />
            )}
            <Text style={[styles.actionText, {color: Colors.gradient1}]}>
              View Job
            </Text>
          </TouchableOpacity>
          {item.status === 'open' ? (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={locked}
                onPress={() => setStatus(item, 'resolved')}
                style={[styles.actionBtn, styles.resolveBtn]}>
                {rowAction === 'resolved' ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Feather name="check" size={15} color={Colors.white} />
                )}
                <Text style={[styles.actionText, {color: Colors.white}]}>
                  Resolve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={locked}
                onPress={() => setStatus(item, 'dismissed')}
                style={[styles.actionBtn, styles.dismissBtn]}>
                {rowAction === 'dismissed' && (
                  <ActivityIndicator size="small" color={Colors.secondaryText} />
                )}
                <Text style={[styles.actionText, {color: Colors.secondaryText}]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.8}
              disabled={locked}
              onPress={() => setStatus(item, 'open')}
              style={[styles.actionBtn, styles.dismissBtn]}>
              {rowAction === 'open' ? (
                <ActivityIndicator size="small" color={Colors.secondaryText} />
              ) : (
                <Feather name="rotate-ccw" size={14} color={Colors.secondaryText} />
              )}
              <Text style={[styles.actionText, {color: Colors.secondaryText}]}>
                Reopen
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {isAdmin && (
        <View style={styles.toolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}>
            {FILTERS.map(chip => {
              const active = filter === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  activeOpacity={0.8}
                  onPress={() => setFilter(chip.key)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}>
                    {loading ? chip.label : `${chip.label} ${counts[chip.key]}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {!isAdmin ? (
        <NotFound text="You don't have access to this section." />
      ) : loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <NotFound
              text={
                filter === 'open'
                  ? 'No open reports. Nice!'
                  : 'No reports in this category'
              }
            />
          }
        />
      )}
    </View>
  );
};

export default AdminReports;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  toolbar: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay60,
  },
  chipRow: {
    paddingBottom: RFPercentage(1.2),
    gap: RFPercentage(0.8),
  },
  chip: {
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  chipText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.45),
  },
  chipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    paddingBottom: RFPercentage(6),
    flexGrow: 1,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Colors.lightGrayBg,
    padding: RFPercentage(1.8),
    marginBottom: RFPercentage(1.5),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: RFPercentage(1),
    marginBottom: RFPercentage(1),
  },
  reasonPill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
    backgroundColor: Colors.redBg50,
    borderRadius: RFPercentage(100),
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.45),
  },
  reasonText: {
    flexShrink: 1,
    color: Colors.dangerRed,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.35),
  },
  statusPill: {
    borderRadius: RFPercentage(100),
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.45),
  },
  statusText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.3),
  },
  jobTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.85),
    marginBottom: RFPercentage(0.8),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
    marginTop: RFPercentage(0.4),
  },
  metaText: {
    flex: 1,
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.45),
  },
  details: {
    marginTop: RFPercentage(1),
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.2),
    backgroundColor: Colors.gray50,
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.1),
  },
  actions: {
    flexDirection: 'row',
    gap: RFPercentage(0.8),
    marginTop: RFPercentage(1.4),
  },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.5),
    borderRadius: RFPercentage(1.3),
    borderWidth: 1,
    paddingHorizontal: RFPercentage(0.6),
  },
  viewBtn: {
    backgroundColor: Colors.blueBg200,
    borderColor: Colors.gradient1,
  },
  resolveBtn: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  dismissBtn: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
  },
  actionText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
  },
});
