import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import JobCard from '../../../../components/JobCard';
import NotFound from '../../../../components/NotFound';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import {showToast} from '../../../../utils/ToastMessage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SERVER_URL = 'https://cleaners-choice-server.vercel.app';

interface Job {
  id: string;
  title?: string;
  location?: {name?: string};
  priceRange?: string;
  createdAt?: any;
  status?: string;
  jobId?: string;
  confirmedCleaner?: string;
  autoCompleted?: boolean;
}

const MyJobs = ({navigation}: any) => {
  const [activeTab, setActiveTab] = useState<
    'active' | 'completed' | 'cancelled'
  >('active');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [completeLoading, setCompleteLoading] = useState<string | null>(null);
  const [jobStats, setJobStats] = useState({
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  useExitAppOnBack();

  const fetchMyJobs = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      let snapshot;
      if (activeTab === 'active') {
        const confirmedSnap = await firestore()
          .collection('Jobs')
          .where('confirmedCleaner', '==', user.uid)
          .where('status', '==', 'confirmed')
          .orderBy('createdAt', 'desc')
          .get();
        const pendingSnap = await firestore()
          .collection('Jobs')
          .where('confirmedCleaner', '==', user.uid)
          .where('status', '==', 'pending_completion')
          .orderBy('createdAt', 'desc')
          .get();
        const allDocs = [...confirmedSnap.docs, ...pendingSnap.docs];
        const jobsList = allDocs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Job[];
        setJobs(jobsList);
        setLoading(false);
        return;
      } else if (activeTab === 'completed') {
        snapshot = await firestore()
          .collection('Jobs')
          .where('confirmedCleaner', '==', user.uid)
          .where('status', '==', 'completed')
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        // Cancelled - jobs where this cleaner was cancelled
        snapshot = await firestore()
          .collection('Jobs')
          .where('cancelledCleaners', 'array-contains', user.uid)
          .orderBy('createdAt', 'desc')
          .get();
      }

      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[];
      setJobs(jobsList);
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchJobStats = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const activeSnap = await firestore()
        .collection('Jobs')
        .where('confirmedCleaner', '==', user.uid)
        .where('status', '==', 'confirmed')
        .get();

      const completedSnap = await firestore()
        .collection('Jobs')
        .where('confirmedCleaner', '==', user.uid)
        .where('status', '==', 'completed')
        .get();

      const cancelledSnap = await firestore()
        .collection('Jobs')
        .where('cancelledCleaners', 'array-contains', user.uid)
        .get();

      setJobStats({
        active: activeSnap.size,
        completed: completedSnap.size,
        cancelled: cancelledSnap.size,
      });
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
      fetchJobStats();
    }, [fetchMyJobs, fetchJobStats]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchMyJobs(), fetchJobStats()]).finally(() =>
      setRefreshing(false),
    );
  };

  const handleMarkCompleted = async (job: Job) => {
    const user = auth().currentUser;
    if (!user) return;

    Alert.alert(
      'Mark as Completed',
      `Mark "${job.title}" as completed? The customer will be notified to confirm.`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          onPress: async () => {
            setCompleteLoading(job.id);
            try {
              await firestore().collection('Jobs').doc(job.id).update({
                status: 'pending_completion',
                completionRequestedAt:
                  firestore.FieldValue.serverTimestamp(),
              });

              if (job.jobId) {
                const userDoc = await firestore()
                  .collection('Users')
                  .doc(user.uid)
                  .get();
                const cleanerName = userDoc.data()?.name || 'Your cleaner';

                const ownerDoc = await firestore()
                  .collection('Users')
                  .doc(job.jobId)
                  .get();
                const ownerData = ownerDoc.data();

                if (ownerData?.fcmToken) {
                  try {
                    await fetch(`${SERVER_URL}/api/send-notification`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        fcmToken: ownerData.fcmToken,
                        title: 'Completion Request',
                        body: `${cleanerName} has marked "${job.title}" as completed. Confirm?`,
                        data: {screen: 'notifications'},
                      }),
                    });
                  } catch (err) {
                    console.error('Error sending notification:', err);
                  }
                }

                try {
                  await firestore().collection('Notifications').add({
                    type: 'completion_request',
                    fromUserId: user.uid,
                    toUserId: job.jobId,
                    jobId: job.id,
                    title: 'Completion Request',
                    body: `${cleanerName} has marked "${job.title}" as completed. Confirm?`,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    read: false,
                    jobTitle: job.title,
                  });
                } catch (err) {
                  console.error('Error storing notification:', err);
                }
              }

              showToast({
                type: 'success',
                title: 'Completion Requested',
                message: 'The customer has been notified to confirm',
              });

              fetchMyJobs();
              fetchJobStats();
            } catch (error) {
              console.error('Error marking job as completed:', error);
              showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to request completion',
              });
            } finally {
              setCompleteLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleCancelJob = async (job: Job) => {
    const user = auth().currentUser;
    if (!user) return;

    Alert.alert(
      'Cancel Job',
      `Are you sure you want to cancel "${job.title}"?`,
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(job.id);
            try {
              await firestore().collection('Jobs').doc(job.id).update({
                confirmedCleaner: null,
                status: 'active',
                cancelledCleaners: firestore.FieldValue.arrayUnion(user.uid),
              });

              // Send notification to job owner
              if (job.jobId) {
                const ownerDoc = await firestore()
                  .collection('Users')
                  .doc(job.jobId)
                  .get();
                const ownerData = ownerDoc.data();

                // Send push notification if FCM token available
                if (ownerData?.fcmToken) {
                  try {
                    await fetch(`${SERVER_URL}/api/send-notification`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        fcmToken: ownerData.fcmToken,
                        title: 'Cleaner Cancelled',
                        body: `The cleaner has cancelled "${job.title}"`,
                        data: {screen: 'notifications'},
                      }),
                    });
                  } catch (err) {
                    console.error('Error sending notification:', err);
                  }
                }

                // Store notification in Firestore (always)
                try {
                  await firestore().collection('Notifications').add({
                    type: 'cancellation',
                    fromUserId: user.uid,
                    toUserId: job.jobId,
                    jobId: job.id,
                    title: 'Cleaner Cancelled',
                    body: `The cleaner has cancelled "${job.title}"`,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    read: false,
                    jobTitle: job.title,
                  });
                } catch (err) {
                  console.error('Error storing notification:', err);
                }
              }

              showToast({
                type: 'success',
                title: 'Job Cancelled',
                message: 'You have cancelled this job',
              });

              fetchMyJobs();
              fetchJobStats();
            } catch (error) {
              console.error('Error cancelling job:', error);
              showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to cancel job',
              });
            } finally {
              setCancelLoading(null);
            }
          },
        },
      ],
    );
  };

  const getTruncatedText = (text: string | null | undefined) => {
    const maxChars = 20;
    if (!text) return '';
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const getTruncatedText2 = (text: string | null | undefined) => {
    const maxChars = 40;
    if (!text) return '';
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const getTabConfig = () => {
    switch (activeTab) {
      case 'active':
        return {
          empty: 'No active jobs\nApply to jobs to get started',
          title: 'Active Jobs',
        };
      case 'completed':
        return {empty: 'No completed jobs yet', title: 'Completed Jobs'};
      case 'cancelled':
        return {empty: 'No cancelled jobs', title: 'Cancelled Jobs'};
    }
  };

  const tabConfig = getTabConfig();

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
        <HeaderBack
          title="My Jobs"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={Colors.white}
        />
      </LinearGradient>

      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gradient1}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsCard}>
              <LinearGradient
                colors={[Colors.white, Colors.blueBg50]}
                style={styles.statsGradient}>
                <Text style={styles.statsTitle}>Job Overview</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialIcons
                        name="work"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.statValue}>{jobStats.active}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {backgroundColor: Colors.successBg},
                      ]}>
                      <MaterialIcons
                        name="done-all"
                        size={20}
                        color={Colors.success}
                      />
                    </View>
                    <Text style={styles.statValue}>{jobStats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {backgroundColor: Colors.redBg100},
                      ]}>
                      <MaterialIcons
                        name="cancel"
                        size={20}
                        color={Colors.red500}
                      />
                    </View>
                    <Text style={styles.statValue}>{jobStats.cancelled}</Text>
                    <Text style={styles.statLabel}>Cancelled</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {(['active', 'completed', 'cancelled'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.tabButtonActive,
                  ]}>
                  <LinearGradient
                    colors={
                      activeTab === tab
                        ? [Colors.gradient1, Colors.gradient2]
                        : [Colors.white, Colors.lavenderFilterBg]
                    }
                    style={styles.tabGradient}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive,
                      ]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{tabConfig.title}</Text>
              <Text style={styles.sectionCount}>
                {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        }
        renderItem={({item}) => (
          <View>
            <JobCard
              name={getTruncatedText(item?.title)}
              location={getTruncatedText2(item?.location?.name)}
              price={item?.priceRange ?? ''}
              date={item?.createdAt}
              onPress={() =>
                navigation.navigate('JobDetails', {item: item})
              }
              onPress2={() => {
                if (activeTab === 'active') {
                  handleCancelJob(item);
                }
              }}
              delete={activeTab === 'active'}
            />
            {activeTab === 'active' && (
              <View style={styles.activeJobActions}>
                {item.status === 'pending_completion' ? (
                  <View style={[styles.completeJobBtn, {opacity: 0.6}]}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={RFPercentage(1.8)}
                      color={Colors.amber500}
                    />
                    <Text
                      style={[
                        styles.completeJobBtnText,
                        {color: Colors.amber500},
                      ]}>
                      Awaiting Confirmation
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.completeJobBtn}
                    activeOpacity={0.7}
                    onPress={() => handleMarkCompleted(item)}
                    disabled={completeLoading === item.id}>
                    {completeLoading === item.id ? (
                      <ActivityIndicator size="small" color={Colors.success} />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={RFPercentage(1.8)}
                          color={Colors.success}
                        />
                        <Text style={styles.completeJobBtnText}>
                          Mark as Completed
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelJobBtn}
                  activeOpacity={0.7}
                  onPress={() => handleCancelJob(item)}
                  disabled={cancelLoading === item.id}>
                  {cancelLoading === item.id ? (
                    <ActivityIndicator size="small" color={Colors.red500} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="close-circle-outline"
                        size={RFPercentage(1.8)}
                        color={Colors.red500}
                      />
                      <Text style={styles.cancelJobBtnText}>Cancel Job</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {activeTab === 'completed' && item.autoCompleted && (
              <View style={styles.autoConfirmedTag}>
                <MaterialCommunityIcons
                  name="clock-check-outline"
                  size={RFPercentage(1.6)}
                  color={Colors.amber500}
                />
                <Text style={styles.autoConfirmedText}>Auto-confirmed</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : (
            <NotFound text={tabConfig.empty} />
          )
        }
      />
    </View>
  );
};

export default MyJobs;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingHorizontal: RFPercentage(2),
  },
  statsCard: {
    marginTop: 20,
    borderRadius: 24,
    shadowColor: Colors.primaryBlue,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  statsGradient: {
    borderRadius: 24,
    padding: 20,
  },
  statsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    color: Colors.primaryText,
    marginBottom: RFPercentage(1.5),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.skyBlueBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.3),
    color: Colors.primaryText,
  },
  statLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.grayBorderOverlay80,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: RFPercentage(2),
    gap: RFPercentage(1),
  },
  tabButton: {
    flex: 1,
    borderRadius: RFPercentage(1.2),
    overflow: 'hidden',
  },
  tabButtonActive: {},
  tabGradient: {
    paddingVertical: RFPercentage(1.2),
    alignItems: 'center',
    borderRadius: RFPercentage(1.2),
  },
  tabText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  tabTextActive: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(0.5),
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    color: Colors.primaryText,
  },
  sectionCount: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  cancelJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redBg100,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(1),
    gap: RFPercentage(0.5),
    flex: 1,
  },
  cancelJobBtnText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.red500,
  },
  activeJobActions: {
    flexDirection: 'row',
    gap: RFPercentage(1),
    marginTop: RFPercentage(-0.5),
    marginBottom: RFPercentage(1),
  },
  completeJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successBg,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(1),
    gap: RFPercentage(0.5),
    flex: 1,
  },
  completeJobBtnText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.success,
  },
  autoConfirmedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.amberBg100,
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(-0.5),
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  autoConfirmedText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.amber500,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(10),
  },
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
});
