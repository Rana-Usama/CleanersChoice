import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import JobCard from '../../../components/JobCard';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../components/CustomModal';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import HeaderBack from '../../../components/HeaderBack';
import NotFound from '../../../components/NotFound';
import {showToast} from '../../../utils/ToastMessage';
import {useExitAppOnBack} from '../../../utils/ExitApp';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Job {
  id: string;
  title?: string;
  location?: {name?: string};
  priceRange?: string;
  createdAt?: any;
  status?: string;
}

const Jobs = ({navigation}: any) => {
  const [active, setActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [Jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(
    undefined,
  );
  const [loading2, setLoading2] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [jobStats, setJobStats] = useState({
    active: 0,
    completed: 0,
    total: 0,
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  useExitAppOnBack();

  // Animation for filter toggle
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // On Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchMyJobs();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1500);
  };

  const toggle1 = () => {
    setStatus('active');
    setActive(true);
    setCompleted(false);
  };

  const toggle2 = () => {
    setStatus('completed');
    setActive(false);
    setCompleted(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
      fetchJobStats();
    }, [status]),
  );

  // Fetch job statistics
  const fetchJobStats = async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const activeSnapshot = await firestore()
        .collection('Jobs')
        .where('jobId', '==', user.uid)
        .where('status', 'in', ['active', 'expired', 'unconfirmed'])
        .get();

      const completedSnapshot = await firestore()
        .collection('Jobs')
        .where('jobId', '==', user.uid)
        .where('status', '==', 'completed')
        .get();

      setJobStats({
        active: activeSnapshot.size,
        completed: completedSnapshot.size,
        total: activeSnapshot.size + completedSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

  // Fetching jobs
  const fetchMyJobs = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      let query = firestore()
        .collection('Jobs')
        .where('jobId', '==', user.uid);

      if (status === 'active') {
        query = query.where(
          'status',
          'in',
          ['active', 'expired', 'unconfirmed'],
        );
      } else {
        query = query.where('status', '==', status);
      }

      const snapshot = await query
        .orderBy('createdAt2', 'desc')
        .get();

      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Deleting jobs
  const handleDeleteJob = async () => {
    setLoading2(true);
    try {
      await firestore().collection('Jobs').doc(selectedJobId).delete();
      setModalVisible(false);
      fetchMyJobs();
      fetchJobStats();
      showToast({
        type: 'success',
        title: 'Job Deleted',
        message: 'Job deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete job',
      });
    } finally {
      setLoading2(false);
    }
  };

  // Truncations
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

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="My Posted Jobs"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={Colors.white}
          rightText="Post Job"
          onPress={() => navigation.navigate('PostJob', {jobId: null})}
          right
        />
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gradient1}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[Colors.white, Colors.blueBg50]}
            style={styles.statsGradient}>
            <Text style={styles.statsTitle}>Job Overview</Text>
            <Text style={styles.statsSubtitle}>Track your job postings</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <MaterialIcons
                    name="work"
                    size={20}
                    color={Colors.gradient1}
                  />
                </View>
                <Text style={styles.statValue}>{jobStats.total}</Text>
                <Text style={styles.statLabel}>Total Jobs</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, styles.activeStatIcon]}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={Colors.success}
                  />
                </View>
                <Text style={[styles.statValue, styles.activeStatValue]}>
                  {jobStats.active}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View
                  style={[styles.statIconContainer, styles.completedStatIcon]}>
                  <MaterialIcons name="done-all" size={20} color={Colors.primaryBlue} />
                </View>
                <Text style={[styles.statValue, styles.completedStatValue]}>
                  {jobStats.completed}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filter Jobs</Text>
          <Text style={styles.sectionSubtitle}>View by job status</Text>

          <View style={styles.filtersContainer}>
            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggle1}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    active
                      ? [Colors.gradient1, Colors.gradient2]
                      : [Colors.white, Colors.lavenderFilterBg]
                  }
                  style={styles.filterGradient}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      active && styles.filterButtonTextActive,
                    ]}>
                    Active Jobs
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggle2}
                style={[
                  styles.filterButton,
                  completed && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    completed
                      ? [Colors.gradient1, Colors.gradient2]
                      : [Colors.white, Colors.lavenderFilterBg]
                  }
                  style={styles.filterGradient}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      completed && styles.filterButtonTextActive,
                    ]}>
                    Completed
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Active Filter Info */}
          <View style={styles.activeFilterCard}>
            <View style={styles.activeFilterContent}>
              <MaterialIcons name="info" size={20} color={Colors.gradient1} />
              <Text style={styles.activeFilterText}>
                {active
                  ? `Showing ${Jobs.length} active job${
                      Jobs.length !== 1 ? 's' : ''
                    }`
                  : `Showing ${Jobs.length} completed job${
                      Jobs.length !== 1 ? 's' : ''
                    }`}
              </Text>
            </View>
          </View>
        </View>

        {/* Jobs Section */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={styles.jobsTitle}>
              {active ? 'Active Job Postings' : 'Completed Jobs'}
            </Text>
            <Text style={styles.jobsCount}>
              {Jobs.length} job{Jobs.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : Jobs.length === 0 ? (
            <View style={styles.noJobsContainer}>
              <NotFound
                text={
                  active
                    ? 'No active jobs posted\nPost a job to get started'
                    : 'No completed jobs yet'
                }
              />
              {active && (
                <TouchableOpacity
                  style={styles.postJobButton}
                  onPress={() => navigation.navigate('PostJob', {jobId: null})}>
                  <LinearGradient
                    colors={[Colors.gradient1, Colors.gradient2]}
                    style={styles.postJobGradient}>
                    <MaterialIcons name="add" size={20} color={Colors.white} />
                    <Text style={styles.postJobText}>Post New Job</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.jobsList}>
              <FlatList
                scrollEnabled={false}
                data={Jobs}
                keyExtractor={item => item?.id.toString()}
                renderItem={({item}) => (
                  <View key={item?.id.toString()}>
                    <JobCard
                      name={getTruncatedText(item?.title)}
                      location={getTruncatedText2(item?.location?.name)}
                      price={item?.priceRange ?? ''}
                      date={item?.createdAt}
                      onPress={() =>
                        navigation.navigate('JobDetails', {item: item})
                      }
                      onPress2={() => {
                        setSelectedJobId(item?.id);
                        setModalVisible(true);
                      }}
                      delete={completed ? false : true}
                      footer={
                        active &&
                        (item?.status === 'expired' ||
                          item?.status === 'unconfirmed') ? (
                          <View style={styles.expiredTag}>
                            <MaterialIcons
                              name="error-outline"
                              size={16}
                              color={Colors.orange600}
                            />
                            <Text style={styles.expiredTagText}>Expired</Text>
                          </View>
                        ) : active && item?.status === 'active' ? (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.manageButton}
                            onPress={() =>
                              navigation.navigate('JobManagement', {
                                jobId: item?.id,
                                jobTitle: item?.title || 'Untitled Job',
                              })
                            }>
                            <MaterialIcons
                              name="people"
                              size={18}
                              color={Colors.gradient1}
                            />
                            <Text style={styles.manageButtonText}>
                              Manage Applicants
                            </Text>
                            <MaterialIcons
                              name="chevron-right"
                              size={20}
                              color={Colors.gradient1}
                            />
                          </TouchableOpacity>
                        ) : undefined
                      }
                    />
                  </View>
                )}
                contentContainerStyle={styles.jobsListContent}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {Jobs.length > 0 && active && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.newJobButton}
          onPress={() => navigation.navigate('PostJob', {jobId: null})}>
          <LinearGradient
            colors={[Colors.gradient1, Colors.gradient2]}
            style={styles.newJobGradient}>
            <MaterialIcons name="add" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title="Delete Job!"
              subTitle={'Are you sure you want to delete this job?'}
              onPress={() => setModalVisible(false)}
              onPress2={handleDeleteJob}
              loader={loading2}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default Jobs;

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
  },
  statsCard: {
    marginTop: 30,
    marginHorizontal: 20,
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
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blueBg50,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0EAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatIcon: {
    backgroundColor: Colors.greenBg100,
  },
  completedStatIcon: {
    backgroundColor: Colors.blueBg300,
  },
  statValue: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.gradient1,
    marginBottom: 4,
  },
  activeStatValue: {
    color: Colors.success,
  },
  completedStatValue: {
    color: Colors.gradient1,
  },
  statLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.placeholderColor,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  filterButtonActive: {
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 6,
  },
  filterGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.filterIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  activeFilterCard: {
    marginTop: 16,
    backgroundColor: Colors.blueBg50,
    borderRadius: 16,
    padding: 16,
  },
  activeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeFilterText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray600,
    flex: 1,
  },
  jobsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobsTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
  },
  jobsCount: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
    backgroundColor: Colors.indigoBg50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.placeholderColor,
  },
  noJobsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  postJobButton: {
    marginTop: 24,
    borderRadius: 100,
    overflow: 'hidden',
    width: '55%',
  },
  postJobGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  postJobText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  jobsList: {
    marginTop: 8,
  },
  jobsListContent: {
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  activeJobCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.gradient1,
  },
  completedJobCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryBlue,
  },
  newJobButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  newJobGradient: {
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: 60,
    height: 60,
  },
  newJobText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.skyBlueBg,
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(0.5),
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  manageButtonText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gradient1,
  },
  expiredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orangeBg50,
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    marginTop: RFPercentage(0.5),
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  expiredTagText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.orange600,
  },
});
