import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch} from 'react-redux';
import {
  setProfileData,
  setProfileCompletion,
} from '../../../../redux/ProfileData/Actions';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import LinearGradient from 'react-native-linear-gradient';
import * as Progress from 'react-native-progress';
import Animated, {FadeInDown, FadeInUp, ZoomIn} from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';

const items = [
  {
    id: '11',
    name: 'Window Cleaning',
    icon: Icons.window,
  },
  {
    id: '22',
    name: 'Chimney Cleaning',
    icon: Icons.chimney,
  },
  {
    id: '33',
    name: 'Carpet Cleaning',
    icon: Icons.carpet,
  },
  {
    id: '44',
    name: 'Residential Cleaning',
    icon: Icons.residential,
  },
  {
    id: '55',
    name: 'Pressure Washing',
    icon: Icons.pressure,
  },
  {
    id: '66',
    name: 'Car Washing',
    icon: Icons.car,
  },
  {
    id: '77',
    name: 'Lawn Care',
    icon: Icons.lawn,
  },
  {
    id: '88',
    name: 'Others',
    icon: Icons.more,
  },
];

const Dashboard: React.FC = ({navigation}: any) => {
  const [profile, setProfile] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [service, setService] = useState<any>(null);
  const dispatch = useDispatch();
  const [visibleItems, setVisibleItems] = useState(4);
  const [loading3, setLoading3] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilitySummary, setAvailabilitySummary] = useState({
    availableDays: 0,
    weeklySchedule: '',
    nextAvailable: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useExitAppOnBack();

  // Unread notifications count
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const unsubscribe = firestore()
      .collection('Notifications')
      .where('toUserId', '==', uid)
      .where('read', '==', false)
      .onSnapshot(snap => setUnreadNotifCount(snap?.size ?? 0));
    return () => unsubscribe();
  }, []);

  // On Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setLoading3(true);
    setLoading(true);
    serviceDetails();
    fetchUserData();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
      setLoading3(false);
    }, 2000);
  };

  useEffect(() => {
    setLoading3(true);
    setTimeout(() => {
      setLoading3(false);
    }, 2000);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, []),
  );

  // User data
  const fetchUserData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setProfile(userData?.profile);
        setName(userData?.name);
        setIsAdmin(userData?.admin);
        dispatch(setProfileData(userData));
      }
    } catch (error) {}
  };

  useFocusEffect(
    React.useCallback(() => {
      serviceDetails();
    }, []),
  );

  // Service Details
  const serviceDetails = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore()
        .collection('CleanerServices')
        .doc(user.uid)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setService(userData);
        calculateAvailabilitySummary(userData?.availability);
      }
    } catch (error) {}
  };

  // Calculate availability summary
  const calculateAvailabilitySummary = (availability: any[]) => {
    if (!availability || availability.length === 0) {
      setAvailabilitySummary({
        availableDays: 0,
        weeklySchedule: 'Not set',
        nextAvailable: 'Not available',
      });
      return;
    }

    const availableDays = availability.filter(item => item.checked).length;

    // Get days with available time slots
    const availableDaysList = availability
      .filter(item => item.checked)
      .map(item => item.day.substring(0, 3))
      .join(', ');

    // Calculate next available slot
    const today = moment();
    const todayIndex = today.day() - 1; // moment days: 0=Sun, 1=Mon, etc.

    let nextAvailableDay = '';
    let nextAvailableTime = '';

    // Check next 7 days
    for (let i = 0; i < 7; i++) {
      const dayIndex = (todayIndex + i) % 7;
      const dayAvailability = availability.find(
        item => getDayIndex(item.day) === dayIndex && item.checked,
      );

      if (dayAvailability) {
        const fromTime = moment(dayAvailability.fromTime.toDate());
        const toTime = moment(dayAvailability.toTime.toDate());

        if (i === 0) {
          // Today
          if (today.isBefore(toTime)) {
            nextAvailableDay = 'Today';
            nextAvailableTime = `${fromTime.format('h:mm A')} - ${toTime.format(
              'h:mm A',
            )}`;
            break;
          }
        } else if (i === 1) {
          nextAvailableDay = 'Tomorrow';
          nextAvailableTime = `${fromTime.format('h:mm A')} - ${toTime.format(
            'h:mm A',
          )}`;
          break;
        } else {
          nextAvailableDay = dayAvailability.day;
          nextAvailableTime = `${fromTime.format('h:mm A')} - ${toTime.format(
            'h:mm A',
          )}`;
          break;
        }
      }
    }

    setAvailabilitySummary({
      availableDays,
      weeklySchedule: availableDaysList || 'Not set',
      nextAvailable: nextAvailableDay
        ? `${nextAvailableDay} ${nextAvailableTime}`
        : 'Not available',
    });
  };

  // Helper function to get day index
  const getDayIndex = (day: string) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.indexOf(day);
  };

  // Format time for display
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    return moment(timestamp.toDate()).format('h:mm A');
  };

  const handleNext = () => {
    setLoading2(true);
    setTimeout(() => {
      setLoading2(false);
      navigation.navigate('ServiceOne');
    }, 500);
  };

  const [profileCompletion, setProfileCompletionValue] = useState('50');
  useEffect(() => {
    if (service) {
      const completion =
        service?.availability?.length > 0 &&
        service?.description?.length > 0 &&
        service?.location?.name?.length > 0 &&
        service?.packages?.length > 0
          ? '100'
          : service?.availability?.length > 0 &&
            service?.description?.length > 0 &&
            service?.location?.name?.length > 0
          ? '80'
          : '50';

      setProfileCompletionValue(completion);
      dispatch(setProfileCompletion(completion));
    }
  }, [service]);

  const handleShowMore = () => {
    setVisibleItems(prev => Math.min(prev + 4, service?.type?.length));
  };

  const handleShowLess = () => {
    setVisibleItems(4);
  };

  // Service Name with icons
  const getServiceItems = (serviceIds: any) => {
    return serviceIds
      ?.map((id: any) => {
        const serviceItem = items.find(item => item.id === id);
        return serviceItem ? serviceItem : null;
      })
      .filter((item: any) => item !== null);
  };
  const serviceItems = getServiceItems(service?.type?.slice(0, visibleItems));

  const [isExpanded, setIsExpanded] = useState(false);
  const getTruncatedText = (text: any) => {
    const maxChars = 100;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const toggleDescription = () => {
    setIsExpanded(prevState => !prevState);
  };

  const cleanDescription =
    service?.description?.replace(/\s+/g, ' ').trim() || '';

  return (
    <View style={styles.safeArea}>
      {/* Modern Header */}
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Dashboard"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={Colors.white}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NotificationsScreen')}
          style={styles.bellButton}>
          <Icon name="bell-outline" size={RFPercentage(2.8)} color={Colors.white} />
          {unreadNotifCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.profileCard}>
          <LinearGradient
            colors={[Colors.white, Colors.blueBg50]}
            style={styles.profileGradient}>
            <View style={styles.profileSection}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('EditProfile')}>
                <View style={styles.avatarContainer}>
                  {loading ? (
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                  ) : (
                    <>
                      <Image
                        source={profile ? {uri: profile} : IMAGES.defaultPic}
                        style={styles.avatar}
                      />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name && name?.length > 10
                      ? `${name.substring(0, 10)}...`
                      : name}
                  </Text>
                  {isAdmin && (
                    <View style={styles.adminBadge}>
                      <MaterialIcons
                        name="security"
                        size={14}
                        color={Colors.white}
                      />
                      <Text style={styles.adminText}>Admin</Text>
                    </View>
                  )}
                </View>

                {/* Rest of the profile info... */}
                <View style={styles.availabilityStats}>
                  <View style={styles.availabilityItem}>
                    <View>
                      <Text style={styles.availabilityValue}>
                        {availabilitySummary.availableDays}
                      </Text>
                      <Text style={styles.availabilityLabel}>Days Weekly</Text>
                    </View>
                  </View>

                  <View style={styles.availabilityDivider} />

                  <View style={styles.availabilityItem}>
                    <View>
                      <Text style={styles.availabilityValue} numberOfLines={1}>
                        {service?.packages?.length || 0}
                      </Text>
                      <Text style={styles.availabilityLabel}>Packages</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Profile Completion */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Profile Completion</Text>
                <Text style={styles.progressPercent}>{profileCompletion}%</Text>
              </View>
              <Progress.Bar
                progress={parseInt(profileCompletion) / 100}
                width={null}
                height={8}
                color={Colors.gradient1}
                unfilledColor={Colors.gray200}
                borderWidth={0}
                borderRadius={20}
                style={styles.progressBar}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {loading3 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.blueMedium} />
          </View>
        ) : (
          <>
            {profileCompletion === '100' ? (
              <Animated.View entering={FadeInUp.duration(600)}>
                {/* Availability Overview Card */}
                <View style={styles.overviewCard}>
                  <LinearGradient
                    colors={[Colors.skeletonLight, Colors.skeletonDark]}
                    style={styles.overviewGradient}>
                    <View style={styles.availabilityOverview}>
                      <View style={styles.availabilityOverviewItem}>
                        <Text style={styles.overviewNumber}>
                          {availabilitySummary.availableDays}
                        </Text>
                        <Text style={styles.overviewLabel}>Availability</Text>
                      </View>
                      <View style={styles.overviewDividerVertical} />

                      <View style={styles.availabilityOverviewItem}>
                        <Text style={styles.overviewNumber}>
                          {service?.type?.length}
                        </Text>
                        <Text style={styles.overviewLabel}>Services</Text>
                      </View>

                      <View style={styles.overviewDividerVertical} />

                      <View style={styles.availabilityOverviewItem}>
                        <Text style={styles.overviewNumber}>
                          {service?.packages?.length || 0}
                        </Text>
                        <Text style={styles.overviewLabel}>Packages</Text>
                      </View>
                    </View>

                    {/* Next Available Time */}
                    <View style={styles.nextAvailableContainer}>
                      <MaterialIcons
                        name="schedule"
                        size={20}
                        color={Colors.grayMuted}
                      />
                      <Text style={styles.nextAvailableText}>
                        Next available: {availabilitySummary.nextAvailable}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Description Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Service Description</Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate('ServiceOne')}>
                      <MaterialIcons
                        name="edit-document"
                        color={Colors.gradient1}
                        size={RFPercentage(1.6)}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.description}>
                    {isExpanded
                      ? cleanDescription + ' '
                      : getTruncatedText(cleanDescription)}
                    {cleanDescription?.length > 100 && (
                      <Text onPress={toggleDescription} style={styles.readMore}>
                        {isExpanded ? 'Read Less' : 'Read More'}
                      </Text>
                    )}
                  </Text>
                </View>

                {/* Services Grid */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>My Services</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ServiceOne')}>
                      <Text style={styles.seeAll}>Edit All</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.servicesGrid}>
                    {serviceItems.map((item: any, index: number) => (
                      <Animated.View
                        key={index}
                        
                        style={styles.serviceCard}>
                        <LinearGradient
                          colors={[Colors.blueBg50, Colors.blueBg100]}
                          style={styles.serviceGradient}>
                          <View style={styles.serviceIconContainer}>
                            <Image
                              source={item.icon}
                              style={styles.serviceIcon}
                            />
                          </View>
                          <Text style={styles.serviceName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </LinearGradient>
                      </Animated.View>
                    ))}
                  </View>
                  {service?.type?.length > 4 && (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={
                        visibleItems < service?.type?.length
                          ? handleShowMore
                          : handleShowLess
                      }
                      style={styles.showMoreButton}>
                      <Text style={styles.showMoreText}>
                        {visibleItems < service?.type.length
                          ? `Show ${service?.type.length - 4} More`
                          : 'Show Less'}
                      </Text>
                      <Image
                        source={Icons.chevronDown}
                        style={styles.chevronIcon}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Packages Slider */}
                <View
                  style={[
                    styles.sectionCard,
                    {padding: 0, paddingVertical: 20},
                  ]}>
                  <View style={[styles.cardHeader, {paddingHorizontal: 20}]}>
                    <Text style={styles.cardTitle}>Starting Packages</Text>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate('ServiceThree')}>
                      <Text style={styles.seeAll}>Edit All</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.packagesContainer}>
                    {service?.packages?.map((item: any, index: number) => (
                      <Animated.View
                        key={index}
                        entering={ZoomIn.delay(index * 150)}
                        style={styles.packageCard}>
                        <LinearGradient
                          colors={[Colors.blueBg100b, Colors.blueBg50]}
                          style={styles.packageGradient}>
                          <View style={styles.packageHeader}>
                            <Text style={styles.packageName}>
                              Package {item.id}
                            </Text>
                            <View style={styles.priceTag}>
                              <Text style={styles.priceText} numberOfLines={1}>
                                ${item.price}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={styles.packageDescription}
                            numberOfLines={8}>
                            {item.details}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.6}
                            style={styles.selectButton}
                            onPress={() => navigation.navigate('ServiceThree')}>
                            <Text style={styles.selectButtonText}>
                              View Details
                            </Text>
                            <Image
                              source={Icons.arrowRight}
                              style={styles.arrowIcon}
                            />
                          </TouchableOpacity>
                        </LinearGradient>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </View>

                {/* Detailed Availability */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Weekly Availability</Text>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate('Availability')}
                      style={styles.availabilityButton}>
                      <Text style={styles.availabilityButtonText}>Edit</Text>
                      <Image source={Icons.edit} style={styles.editIcon} />
                    </TouchableOpacity>
                  </View>

                  {service?.availability?.filter((item: any) => item.checked)
                    .length > 0 ? (
                    <View style={styles.detailedAvailability}>
                      {service?.availability
                        ?.filter((item: any) => item.checked)
                        .map((item: any, index: number) => (
                          <View key={index} style={styles.timeSlotCard}>
                            <View style={styles.timeSlotHeader}>
                              <View
                                style={[
                                  styles.dayIndicator,
                                  item.checked && styles.dayIndicatorActive,
                                ]}>
                                <Text style={styles.dayIndicatorText}>
                                  {item.day.charAt(0)}
                                </Text>
                              </View>
                              <Text style={styles.dayText}>{item.day}</Text>
                              <View style={styles.timeSlot}>
                                <MaterialIcons
                                  name="schedule"
                                  size={14}
                                  color={Colors.gray600}
                                />
                                <Text style={styles.timeText}>
                                  {formatTime(item.fromTime)} -{' '}
                                  {formatTime(item.toTime)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.availabilityStatus}>
                              <View
                                style={[
                                  styles.statusIndicator,
                                  item.checked && styles.statusIndicatorActive,
                                ]}>
                                <Text style={styles.statusText}>
                                  {item.checked ? 'Available' : 'Unavailable'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                    </View>
                  ) : (
                    <View style={styles.noAvailabilityContainer}>
                      <MaterialIcons
                        name="calendar-today"
                        size={40}
                        color={Colors.slate300}
                      />
                      <Text style={styles.noAvailabilityText}>
                        No availability set
                      </Text>
                      <Text style={styles.noAvailabilitySubtext}>
                        Set your availability to start receiving bookings
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeInUp.duration(600)}
                style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={[Colors.white, Colors.blueBg50]}
                  style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIcon}>
                    <Image
                      source={Icons.dashBoard}
                      style={styles.dashboardIcon}
                    />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    Ready to Get Started? 🚀
                  </Text>
                  <Text style={styles.emptyStateText}>
                    Complete your profile setup to start offering services and
                    connect with customers looking for your expertise
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.6}
                    style={styles.ctaButton}
                    onPress={handleNext}
                    disabled={loading2}>
                    {loading2 ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Text style={styles.ctaButtonText}>
                          Complete Profile
                        </Text>
                        <Image
                          source={Icons.arrowRight}
                          style={styles.ctaArrow}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Dashboard;

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
  bellButton: {
    position: 'absolute',
    right: 20,
    bottom: 35,
    padding: 6,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.red500,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
  },
  editButtonText: {
    color: Colors.white,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  scrollContent: {
    marginTop: RFPercentage(8),
    paddingBottom: Platform.OS === 'ios' ? 140 : RFPercentage(20),
  },
  profileCard: {
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: Colors.primaryBlue,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  profileGradient: {
    borderRadius: 24,
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.gradient1,
    backgroundColor: Colors.lightGrayBg,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.gradient1,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.1),
    color: Colors.gray800,
    marginBottom: 12,
  },
  availabilityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blueBg50,
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    // backgroundColor:"red",
    justifyContent: 'center',
  },
  availabilityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.blueBg300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityValue: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
    textAlign: 'center',
  },
  availabilityLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.placeholderColor,
    marginTop: 2,
    textAlign: 'center',
  },
  availabilityDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.gray600,
  },
  progressPercent: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  progressBar: {
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  overviewCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primaryBlue,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 15,
      borderWidth: 1,
    borderColor: Colors.blueBg150
    // elevation: 8,
  },
  overviewGradient: {
    padding: 20,
  },
  availabilityOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilityOverviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewNumber: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.5),
    color: Colors.secondaryText,
    marginTop: 8,
    marginBottom: 4,
  },
  overviewSchedule: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.secondaryText,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  overviewLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.grayMuted,
    textAlign: 'center',
  },
  overviewDividerVertical: {
    width: 1,
    height: 60,
    backgroundColor: Colors.whiteOverlay30,
    marginHorizontal: 16,
  },
  nextAvailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  nextAvailableText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.grayMuted,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 10,
      borderWidth: 1,
    borderColor: Colors.blueBg150
    // elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    color: Colors.grayBlueText,
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.lightGrayBg,
  },
  smallEditIcon: {
    width: 16,
    height: 16,
  },
  description: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.placeholderColor,
    lineHeight: 22,
  },
  readMore: {
    fontFamily: Fonts.semiBold,
    color: Colors.blueSoft,
    fontSize: RFPercentage(1.7),
  },
  seeAll: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryBlue,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
      borderWidth: 1,
    borderColor: Colors.blueBg150
    // elevation: 2,
  },
  serviceGradient: {
    padding: 16,
    borderRadius: 16,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 100,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
  },
  serviceIcon: {
    width: 25,
    height: 25,
  },
  serviceName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gray700,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.blueBg50,
    borderRadius: 12,
  },
  showMoreText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryBlue,
    marginRight: 8,
  },
  chevronIcon: {
    width: 14,
    height: 14,
    tintColor: Colors.primaryBlue,
  },
  packagesContainer: {
    paddingRight: 20,
    paddingHorizontal: 10,
  },
  packageCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
    height: RFPercentage(30),
      borderWidth: 1,
    borderColor: Colors.blueBg150
  },
  packageGradient: {
    padding: 16,
    borderRadius: 12,
    height: RFPercentage(30),
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageName: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gray800,
    flex: 1,
  },
  priceTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    maxWidth:RFPercentage(8)
  },
  priceText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
    color: Colors.white,
  },
  packageDescription: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.placeholderColor,
    lineHeight: 18,
    marginVertical: 24,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lavenderBg,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  selectButtonText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gray700,
    marginRight: 8,
  },
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.gray700,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blueBg150,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availabilityButtonText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryBlue,
    marginRight: 6,
  },
  editIcon: {
    width: 12,
    height: 12,
    tintColor: Colors.primaryBlue,
  },
  detailedAvailability: {
    gap: 12,
  },
  timeSlotCard: {
    backgroundColor: Colors.blueBg50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayIndicatorActive: {
    backgroundColor: Colors.gradient1,
  },
  dayIndicatorText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.white,
  },
  dayText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gray800,
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gray600,
  },
  availabilityStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    backgroundColor: Colors.redBg50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicatorActive: {
    backgroundColor: Colors.greenBg100,
  },
  statusText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.gray700,
  },
  noAvailabilityContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAvailabilityText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gray700,
    marginTop: 12,
    marginBottom: 4,
  },
  noAvailabilitySubtext: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.placeholderColor,
    textAlign: 'center',
  },
  emptyStateContainer: {
    marginHorizontal: 20,
    marginTop: 40,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,

    borderWidth: 1,
    borderColor: Colors.blueBg150
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.blueBg150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dashboardIcon: {
    width: 50,
    height: 50,
    tintColor: Colors.primaryBlue,
  },
  emptyStateTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    color: Colors.gray800,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.placeholderColor,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gradient1,
    paddingHorizontal: 32,
    borderRadius: 100,
    width: '65%',
    height:RFPercentage(5.6)
  },
  ctaButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.white,
    marginRight: 12,
  },
  ctaArrow: {
    width: 16,
    height: 16,
    tintColor: Colors.white,
  },

  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success, // Green color for admin
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },

  adminText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.white,
  },
});
