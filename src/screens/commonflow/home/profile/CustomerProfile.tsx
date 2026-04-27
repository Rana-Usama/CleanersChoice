import {
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../../constants/Themes';
import firestore from '@react-native-firebase/firestore';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import CalendarIconRaw from '../../../../assets/svg/calander';
import LocationIconRaw from '../../../../assets/svg/location';
import SmsIconRaw from '../../../../assets/svg/sms';

const EmptyComponent = () => null;
const isRenderableComponent = (candidate: any) =>
  typeof candidate === 'function' ||
  !!(candidate && typeof candidate === 'object' && candidate.$$typeof);
const resolveSvgComponent = (moduleRef: any) => {
  let current = moduleRef;
  for (let i = 0; i < 5; i += 1) {
    if (isRenderableComponent(current)) {
      return current;
    }
    if (current && typeof current === 'object' && 'default' in current) {
      current = current.default;
      continue;
    }
    break;
  }
  return EmptyComponent;
};

const CalendarIcon = resolveSvgComponent(CalendarIconRaw);
const LocationIcon = resolveSvgComponent(LocationIconRaw);
const SmsIcon = resolveSvgComponent(SmsIconRaw);

type JobItem = {
  id: string;
  title?: string;
  description?: string;
  location?: {
    name?: string;
    address?: string;
  };
  priceRange?: string;
  createdAt?: any;
  createdAt2?: any;
  status?: string;
  confirmedCleaner?: string | null;
};

type CustomerStats = {
  active: number;
  completed: number;
  total: number;
  hiringRate: number;
};

const ACTIVE_JOB_STATUSES = ['active', 'confirmed', 'pending_completion'];
const HIRED_JOB_STATUSES = ['confirmed', 'pending_completion', 'completed'];

const getTimestamp = (value: any) => {
  if (!value) {
    return 0;
  }

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  return 0;
};

const getFormattedJobDate = (job: JobItem) => {
  if (typeof job.createdAt === 'string' && job.createdAt.trim()) {
    return job.createdAt;
  }

  const rawDate = job.createdAt2 ?? job.createdAt;
  let dateValue: Date | null = null;

  if (rawDate?.toDate) {
    dateValue = rawDate.toDate();
  } else if (rawDate instanceof Date) {
    dateValue = rawDate;
  } else if (typeof rawDate === 'number') {
    dateValue = new Date(rawDate);
  }

  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return 'Date not available';
  }

  return dateValue.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getJobLocationLabel = (job: JobItem) =>
  job?.location?.name || job?.location?.address || 'Location not available';

const getStatusConfig = (status?: string) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        icon: 'check-circle',
        textColor: '#4F7FF7',
        bgColor: '#EDF3FF',
      };
    case 'confirmed':
      return {
        label: 'Cleaner Confirmed',
        icon: 'account-check',
        textColor: '#4F7FF7',
        bgColor: '#EDF3FF',
      };
    case 'pending_completion':
      return {
        label: 'Awaiting Confirmation',
        icon: 'clock-check-outline',
        textColor: '#D58B1D',
        bgColor: '#FFF6E6',
      };
    case 'unconfirmed':
      return {
        label: 'Unconfirmed',
        icon: 'account-alert-outline',
        textColor: '#D97706',
        bgColor: '#FFF3E8',
      };
    case 'expired':
      return {
        label: 'Expired',
        icon: 'clock-alert-outline',
        textColor: '#D97706',
        bgColor: '#FFF3E8',
      };
    case 'active':
    default:
      return {
        label: 'Active',
        icon: 'check-circle-outline',
        textColor: '#16A34A',
        bgColor: '#EAFBF1',
      };
  }
};

const CustomerProfile = ({route, navigation}: any) => {
  const {customerId} = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobItem[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>(
    'active',
  );
  const [jobStats, setJobStats] = useState<CustomerStats>({
    active: 0,
    completed: 0,
    total: 0,
    hiringRate: 0,
  });

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const [userDoc, jobsSnapshot] = await Promise.all([
        firestore().collection('Users').doc(customerId).get(),
        firestore().collection('Jobs').where('jobId', '==', customerId).get(),
      ]);

      const userData = userDoc.exists ? userDoc.data() : null;
      const fetchedJobs = jobsSnapshot.docs
        .map(doc => ({id: doc.id, ...doc.data()}) as JobItem)
        .sort(
          (first, second) =>
            getTimestamp(second.createdAt2 ?? second.createdAt) -
            getTimestamp(first.createdAt2 ?? first.createdAt),
        );

      const nextActiveJobs = fetchedJobs.filter(job =>
        ACTIVE_JOB_STATUSES.includes(job.status || 'active'),
      );
      const nextCompletedJobs = fetchedJobs.filter(
        job => job.status === 'completed',
      );
      const hiredJobsCount = fetchedJobs.filter(
        job =>
          !!job.confirmedCleaner ||
          HIRED_JOB_STATUSES.includes(job.status || ''),
      ).length;
      const totalJobs = fetchedJobs.length;

      // Hiring rate = jobs that progressed into a hired state out of all jobs posted.
      const hiringRate = totalJobs
        ? Math.round((hiredJobsCount / totalJobs) * 100)
        : 0;

      setProfile(userData);
      setAllJobs(fetchedJobs);
      setActiveJobs(nextActiveJobs);
      setCompletedJobs(nextCompletedJobs);
      setJobStats({
        active: nextActiveJobs.length,
        completed: nextCompletedJobs.length,
        total: totalJobs,
        hiringRate,
      });
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      setProfile(null);
      setAllJobs([]);
      setActiveJobs([]);
      setCompletedJobs([]);
      setJobStats({
        active: 0,
        completed: 0,
        total: 0,
        hiringRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData]),
  );

  const displayedJobs = selectedTab === 'active' ? activeJobs : completedJobs;
  const latestJobWithLocation = allJobs.find(
    job => job?.location?.name || job?.location?.address,
  );
  const resolvedAddress =
    profile?.location?.name ||
    profile?.location?.address ||
    profile?.address ||
    latestJobWithLocation?.location?.name ||
    latestJobWithLocation?.location?.address ||
    'Address not available';

  const renderStatBlock = (
    value: number,
    label: string,
    bordered?: boolean,
  ) => (
    <View style={[styles.statBlock, bordered && styles.statBlockBorder]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );

  const renderJobCard = (job: JobItem) => {
    const statusConfig = getStatusConfig(job.status);

    return (
      <View
        key={job.id}
        style={styles.jobCard}>
        <View style={styles.jobHeaderRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job.title || 'Untitled Job'}
          </Text>

          <Text style={styles.jobBudgetText}>
            Budget{' '}
            <Text style={styles.jobBudgetValue}>{job.priceRange || '0'}$</Text>
          </Text>
        </View>

        <Text style={styles.jobDescription} numberOfLines={2}>
          {job.description || 'No description provided for this job posting.'}
        </Text>

        <View style={styles.jobMetaCard}>
          <View style={styles.jobMetaRow}>
            <CalendarIcon width={RFPercentage(2.1)} height={RFPercentage(2.1)} />
            <Text style={styles.jobMetaText}>{getFormattedJobDate(job)}</Text>
          </View>

          <View style={styles.jobMetaRow}>
            <LocationIcon width={RFPercentage(2.1)} height={RFPercentage(2.1)} />
            <Text style={styles.jobMetaText} numberOfLines={1}>
              {getJobLocationLabel(job)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
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
          <Text style={styles.headerTitle}>Customer Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <Image
                source={profile?.profile ? {uri: profile.profile} : IMAGES.defaultPic}
                resizeMode="cover"
                style={styles.avatar}
              />

              <View style={styles.profileInfoWrap}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {profile?.name || 'Customer'}
                </Text>

                <View style={[styles.profileMetaRow, {alignItems: 'flex-start'}]}>
                  <LocationIcon width={RFPercentage(2.1)} height={RFPercentage(2.1)} />
                  <Text style={styles.profileMetaText} numberOfLines={2}>
                    {resolvedAddress}
                  </Text>
                </View>

                <View style={styles.profileMetaRow}>
                  <SmsIcon width={RFPercentage(2.05)} height={RFPercentage(2.05)} />
                  <Text style={styles.profileMetaText} numberOfLines={1}>
                    {profile?.email || 'Email not available'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.rateSection}>
              <View style={styles.rateHeaderRow}>
                <Text style={styles.rateLabel}>Hiring Rate</Text>
                <Text style={styles.rateValue}>{jobStats.hiringRate}%</Text>
              </View>

              <View style={styles.rateTrack}>
                <View
                  style={[
                    styles.rateFill,
                    {width: `${jobStats.hiringRate}%`},
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.statsCard}>
            {renderStatBlock(jobStats.active, 'Active Jobs', true)}
            {renderStatBlock(jobStats.completed, 'Completed Jobs', true)}
            {renderStatBlock(jobStats.total, 'Total Posted', false)}
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedTab('active')}
              style={[
                styles.tabButton,
                selectedTab === 'active' && styles.activeTabButton,
              ]}>
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === 'active' && styles.activeTabButtonText,
                ]}>
                Active Jobs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedTab('completed')}
              style={[
                styles.tabButton,
                selectedTab === 'completed' && styles.activeTabButton,
              ]}>
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === 'completed' && styles.activeTabButtonText,
                ]}>
                Completed Jobs
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.jobsListSection}>
            {displayedJobs.length ? (
              displayedJobs.map(renderJobCard)
            ) : (
              <View style={styles.emptyStateCard}>
                <Feather
                  name={selectedTab === 'active' ? 'briefcase' : 'check-circle'}
                  size={RFPercentage(4.5)}
                  color={Colors.gradient1}
                />
                <Text style={styles.emptyStateTitle}>
                  {selectedTab === 'active'
                    ? 'No active jobs yet'
                    : 'No completed jobs yet'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {selectedTab === 'active'
                    ? 'This customer has not posted any in-progress jobs yet.'
                    : 'This customer has not completed any jobs yet.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default CustomerProfile;

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
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: RFPercentage(2.3),
    paddingBottom: RFPercentage(4),
    paddingTop: RFPercentage(2),
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: RFPercentage(2.1),
    paddingVertical: RFPercentage(2.2),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: RFPercentage(11.5),
    height: RFPercentage(11.5),
    borderRadius: RFPercentage(6.3),
    borderWidth: RFPercentage(0.1),
    borderColor: Colors.gradient1,
    marginRight: RFPercentage(2),
    marginTop: RFPercentage(-2),
  },
  profileInfoWrap: {
    flex: 1,
    paddingLeft: RFPercentage(1),
  },
  nameText: {
    color: '#21242B',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.3),
    marginBottom: RFPercentage(1),
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.75),
  },
  profileMetaText: {
    flex: 1,
    color: '#6B7280',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.65),
    marginLeft: RFPercentage(0.8),
    lineHeight: RFPercentage(2.2),
  },
  rateSection: {
    marginTop: RFPercentage(2.2),
  },
  rateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(1),
  },
  rateLabel: {
    color: '#1E1E1E',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.90),
  },
  rateValue: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.70),
  },
  rateTrack: {
    width: '100%',
    height: RFPercentage(1.10),
    borderRadius: RFPercentage(1),
    backgroundColor: 'rgba(64, 123, 255, 0.3)',
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    backgroundColor: '#407BFF',
    borderRadius: RFPercentage(1),
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(64, 123, 255, 0.05)',
    borderRadius: RFPercentage(2.3),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: RFPercentage(2),
    paddingVertical: RFPercentage(1.8),
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(0.5),
  },
  statBlockBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  statValue: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.5),
    marginBottom: RFPercentage(0.4),
  },
  statLabel: {
    color: '#7E8798',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: RFPercentage(2.4),
    gap: RFPercentage(2),
  },
  tabButton: {
    flex: 1,
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1.2),
    backgroundColor: 'rgba(84, 137, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1),
  },
  activeTabButton: {
    backgroundColor: Colors.gradient1,
  },
  tabButtonText: {
    color: '#21242B',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.50),
  },
  activeTabButtonText: {
    color: Colors.white,
  },
  jobsListSection: {
    marginTop: RFPercentage(2),
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    marginBottom: RFPercentage(1.8),
  },
  jobHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  jobTitle: {
    flex: 1,
    color: '#21242B',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.12),
    marginRight: RFPercentage(1.2),
  },
  jobBudgetText: {
    color: '#7E8798',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  jobBudgetValue: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.82),
  },
  jobDescription: {
    color: 'rgba(30, 30, 30, 0.4)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.74),
    lineHeight: RFPercentage(2.4),
    marginTop: RFPercentage(1.2),
    marginBottom: RFPercentage(1.8),
  },
  jobMetaCard: {
    backgroundColor: 'rgba(84, 137, 255, 0.05)',
    borderRadius: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(1.4),
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.9),
  },
  jobMetaText: {
    flex: 1,
    color: '#6F7B91',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.60),
    marginLeft: RFPercentage(0.8),
  },
  jobFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1.4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.6),
    maxWidth: '72%',
  },
  statusText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.43),
    marginLeft: RFPercentage(0.5),
  },
  viewDetailsText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.55),
  },
  emptyStateCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.1),
    borderWidth: 1,
    borderColor: '#E8EDF5',
    paddingVertical: RFPercentage(3.2),
    paddingHorizontal: RFPercentage(2),
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#21242B',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    marginTop: RFPercentage(1.2),
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#7E8798',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.2),
    marginTop: RFPercentage(0.8),
    textAlign: 'center',
  },
});