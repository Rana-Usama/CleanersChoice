import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../../constants/Themes';
import NotificationBadge from '../../../../components/NotificationBadge';
import CleanerCoachMarks from '../../../../components/CleanerCoachMarks';
import LocationDisclosureModal from '../../../../components/LocationDisclosureModal';
import {useCurrentLocation} from '../../../../utils/userLocation';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch} from 'react-redux';
import {
  setProfileData,
  setHasServiceDetails,
} from '../../../../redux/ProfileData/Actions';
import {
  describeListingStatus,
  REQUIRED_FIELD_LABELS,
  syncRequiredProfileMirror,
} from '../../../../utils/cleanerProfile';
import {formatCityState} from '../../../../utils/locationFormat';
import {
  markCoachMarksSeenForRole,
  shouldShowCoachMarksForRole,
} from '../../../../utils/coachMarks';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, {Path} from 'react-native-svg';
import moment from 'moment';
import WindowCleanIcon from '../../../../assets/svg/windowCleanIcon';
import ChimneyIcon from '../../../../assets/svg/chimneyIcon';
import CarpetIcon from '../../../../assets/svg/carpetIcon';
import ResidentialIcon from '../../../../assets/svg/residentialIcon';
import PressureIcon from '../../../../assets/svg/pressureIcon';
import CarIcon from '../../../../assets/svg/carIcon';
import LawnIcon from '../../../../assets/svg/lawnIcon';
import OtherIcon from '../../../../assets/svg/otherIcon';
import {Invoice} from '../../../../types/invoice';
import {buildAnnualEarningsSummary} from '../../../../services/earningsService';
import {useAppleReceiptRefresh} from '../../../../hooks/useAppleReceiptRefresh';
import {WorkMonthlyDashboard} from '../../../../components/work/WorkMonthlyDashboard';
import {WorkTodayJobs} from '../../../../components/work/WorkTodayJobs';

const CURRENT_YEAR = new Date().getFullYear();

const formatCurrency = (amount: number): string =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const AdminIcon = ({
  width = 12,
  height = 12,
}: {
  width?: number;
  height?: number;
}) => (
  <Svg width={width} height={height} viewBox="0 0 14 14" fill="none">
    <Path
      d="m6.12 1.302-2.912 1.09c-.67.251-1.219 1.045-1.219 1.762v4.334c0 .689.455 1.593 1.01 2.007l2.508 1.873c.822.618 2.176.618 2.998 0l2.508-1.873c.555-.414 1.01-1.318 1.01-2.007V4.154c0-.717-.549-1.51-1.22-1.762l-2.91-1.09c-.496-.181-1.29-.181-1.774 0"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 6.37h-.076a1.028 1.028 0 0 1 .04-2.053A1.028 1.028 0 0 1 7 6.37M5.839 8.003c-.56.373-.56.986 0 1.36.636.425 1.68.425 2.316 0 .56-.374.56-.987 0-1.36-.63-.426-1.674-.426-2.316 0"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const items = [
  {
    id: '11',
    name: 'Window Cleaning',
    Icon: WindowCleanIcon,
  },
  {
    id: '22',
    name: 'Chimney Cleaning',
    Icon: ChimneyIcon,
  },
  {
    id: '33',
    name: 'Carpet Cleaning',
    Icon: CarpetIcon,
  },
  {
    id: '44',
    name: 'Residential Cleaning',
    Icon: ResidentialIcon,
  },
  {
    id: '55',
    name: 'Pressure Washing',
    Icon: PressureIcon,
  },
  {
    id: '66',
    name: 'Car Washing',
    Icon: CarIcon,
  },
  {
    id: '77',
    name: 'Lawn Care',
    Icon: LawnIcon,
  },
  {
    id: '88',
    name: 'Others',
    Icon: OtherIcon,
  },
];

const Dashboard: React.FC = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [service, setService] = useState<any>(null);
  const dispatch = useDispatch();
  const [loading3, setLoading3] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilitySummary, setAvailabilitySummary] = useState({
    availableDays: 0,
    weeklySchedule: '',
    nextAvailable: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDoc, setUserDoc] = useState<Record<string, any> | null>(null);
  const [serviceLoaded, setServiceLoaded] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showCleanerCoachMarks, setShowCleanerCoachMarks] = useState(false);
  const {disclosureVisible, acceptDisclosure, declineDisclosure} =
    useCurrentLocation();

  const [locationModalAllowed, setLocationModalAllowed] = useState(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useAppleReceiptRefresh();

  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState(() =>
    buildAnnualEarningsSummary([], CURRENT_YEAR),
  );

  useExitAppOnBack();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const syncCoachMarksVisibility = async () => {
        if (!isActive) return;
        const shouldShow = await shouldShowCoachMarksForRole('cleaner');
        if (isActive) {
          setShowCleanerCoachMarks(shouldShow);
          setLocationModalAllowed(!shouldShow);
        }
      };

      void syncCoachMarksVisibility();

      return () => {
        isActive = false;
      };
    }, []),
  );

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
    fetchEarningsSummary();
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
        setUserDoc(userData ?? null);
        dispatch(setProfileData(userData));

        // Self-heal the listing mirror (CleanerServices name/phone/location)
        // in case its write failed at sign-up or on the business-info screen.
        // Idempotent — writes only when something differs.
        syncRequiredProfileMirror(user.uid, userData)
          .then(wrote => {
            if (wrote) serviceDetails();
          })
          .catch(error =>
            console.log('[Dashboard] listing mirror sync failed:', error),
          );
      }
    } catch (error) {
      console.log('[Dashboard] fetchUserData failed:', error);
    }
  };

  const fetchEarningsSummary = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setEarningsLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Invoices')
        .where('cleanerId', '==', user.uid)
        .where('paymentStatus', '==', 'paid')
        .get();
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
      setEarningsSummary(buildAnnualEarningsSummary(invoices, CURRENT_YEAR));
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEarningsSummary();
    }, []),
  );

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
    } catch (error) {
      console.log('[Dashboard] serviceDetails failed:', error);
    } finally {
      setServiceLoaded(true);
    }
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
    const todayIndex = today.day() - 1;

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

  // Optional listing details (description / service types). Decides whether
  // the Dashboard shows the details cards or the "Set up services" prompt.
  // It does NOT affect visibility — see listingStatus below.
  const hasServiceDetails =
    !!service?.description?.trim?.() || (service?.type?.length ?? 0) > 0;
  useEffect(() => {
    dispatch(setHasServiceDetails(hasServiceDetails));
  }, [dispatch, hasServiceDetails]);

  // Visibility = required business info + active subscription. Evaluated on
  // the same CleanerServices document the customer Home screen reads, so what
  // the cleaner sees here is exactly what customers get.
  const listingStatus = describeListingStatus(service, userDoc ?? undefined);
  const serviceAreaLabel = formatCityState(
    service?.location ?? userDoc?.serviceLocation,
    'Not set',
  );
  const missingLabels = listingStatus.missing
    .map(field => REQUIRED_FIELD_LABELS[field].toLowerCase())
    .join(', ');
  const openBusinessInfo = () =>
    navigation.navigate('CompleteBusinessInfo', {mode: 'edit'});

  // Service Name with icons
  const getServiceItems = (serviceIds: any) => {
    return serviceIds
      ?.map((id: any) => {
        const serviceItem = items.find(item => item.id === id);
        return serviceItem ? serviceItem : null;
      })
      .filter((item: any) => item !== null);
  };

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
  const earningsYoyText =
    earningsSummary.yoyPercent === null
      ? earningsSummary.total > 0
        ? `${CURRENT_YEAR} vs ${CURRENT_YEAR - 1}`
        : `No paid invoices in ${CURRENT_YEAR - 1}`
      : `${
          earningsSummary.yoyPercent >= 0 ? '+' : ''
        }${earningsSummary.yoyPercent.toFixed(0)}% vs ${CURRENT_YEAR - 1}`;

  const completeCleanerCoachMarks = async () => {
    setShowCleanerCoachMarks(false);
    await markCoachMarksSeenForRole('cleaner');
    setTimeout(() => {
      if (isMountedRef.current) {
        setLocationModalAllowed(true);
      }
    }, 400);
  };

  const handleSkipCleanerCoachMarks = () => {
    void completeCleanerCoachMarks();
  };

  const handleNextCleanerCoachMarks = () => {
    void completeCleanerCoachMarks();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const businessName = service?.name?.trim?.() || name || 'Your business';
  const allServices = getServiceItems(service?.type) || [];
  const openDays: string[] = (service?.availability || [])
    .filter((item: any) => item.checked)
    .map((item: any) => item.day);

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={d.scroll}
        showsVerticalScrollIndicator={false}>
        {/* ---- greeting band (variant A) ------------------------------- */}
        <LinearGradient
          colors={[Colors.gradient1, Colors.gradient2]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[d.band, {paddingTop: insets.top + 14}]}>
          <View style={d.bandRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditProfile')}
              style={d.avatar}>
              {loading ? (
                <ActivityIndicator color={Colors.gradient1} />
              ) : (
                <Image
                  source={profile ? {uri: profile} : IMAGES.defaultPic}
                  style={d.avatarImage}
                />
              )}
            </TouchableOpacity>
            <View style={d.grow}>
              <Text style={d.greeting}>{greeting}</Text>
              <Text style={d.name} numberOfLines={2}>
                {businessName}
              </Text>
              {isAdmin && (
                <View style={d.adminBadge}>
                  <AdminIcon width={11} height={11} />
                  <Text style={d.adminText}>Admin</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Notifications${
                unreadNotifCount ? `, ${unreadNotifCount} unread` : ''
              }`}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NotificationsScreen')}
              style={d.headerButton}>
              <Icon name="bell-outline" size={20} color={Colors.white} />
              <NotificationBadge count={unreadNotifCount} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Settings"
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Settings')}
              style={d.headerButton}>
              <Icon name="cog-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Listing visibility: what customers see, one tap to fix */}
          {serviceLoaded && userDoc ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit business info"
              activeOpacity={0.8}
              onPress={openBusinessInfo}
              style={d.visibility}>
              <View
                style={[
                  d.visibilityDot,
                  {
                    backgroundColor: listingStatus.live ? '#6EE7B7' : '#FCD34D',
                  },
                ]}
              />
              <View style={d.grow}>
                <Text style={d.visibilityTitle} numberOfLines={1}>
                  {listingStatus.live
                    ? 'Visible to customers'
                    : 'Hidden from customers'}
                  {serviceAreaLabel ? ` · ${serviceAreaLabel}` : ''}
                </Text>
                {!listingStatus.live && (
                  <Text style={d.visibilityText}>
                    {listingStatus.reason === 'missing_profile'
                      ? `Add your ${missingLabels} to appear in customer search.`
                      : 'Your listing will appear once your membership is active.'}
                  </Text>
                )}
              </View>
              <Text style={d.visibilityEdit}>
                {listingStatus.reason === 'missing_profile'
                  ? 'Complete'
                  : 'Edit'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        <View style={d.body}>
          {/* ---- today + month (variant A) ----------------------------- */}
          <WorkTodayJobs />
          <WorkMonthlyDashboard />

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Earnings')}
            style={[d.card, d.navRow]}>
            <View style={[d.navIcon, {backgroundColor: '#ECFDF5'}]}>
              <Icon name="trending-up" size={20} color="#047857" />
            </View>
            <View style={d.grow}>
              <Text style={d.navLabel}>Invoice earnings · {CURRENT_YEAR}</Text>
              {earningsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.gradient1}
                  style={d.loader}
                />
              ) : (
                <>
                  <Text style={d.navValue}>
                    {formatCurrency(earningsSummary.total)}
                  </Text>
                  <Text style={d.navSub} numberOfLines={1}>
                    {earningsYoyText} · {earningsSummary.paidInvoices.length}{' '}
                    paid invoice
                    {earningsSummary.paidInvoices.length !== 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </View>
            <Icon name="chevron-right" size={20} color={Colors.gray400} />
          </TouchableOpacity>

          {/* Admin Controls — only for users with Users.admin === true. */}
          {isAdmin && (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminDashboard')}
              style={[d.card, d.navRow]}>
              <View style={[d.navIcon, {backgroundColor: Colors.slate100}]}>
                <Icon
                  name="shield-account-outline"
                  size={20}
                  color={Colors.slateText}
                />
              </View>
              <View style={d.grow}>
                <Text style={d.navTitle}>Admin Controls</Text>
                <Text style={d.navSub}>
                  Monitor all jobs and cleaner services
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          )}

          {/* ---- listing (variant C) ----------------------------------- */}
          {loading3 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.blueMedium} />
            </View>
          ) : hasServiceDetails ? (
            <>
              <View style={d.section}>
                <View style={d.sectionHeader}>
                  <Text style={d.sectionTitle}>My services</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit services"
                    hitSlop={{top: 10, bottom: 10, left: 12, right: 12}}
                    onPress={() => navigation.navigate('ServiceOne')}>
                    <Text style={d.sectionLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {allServices.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={d.rail}>
                    {allServices.map((item: any) => {
                      const IconComp = item.Icon;
                      return (
                        <View key={item.id} style={d.serviceItem}>
                          <View style={d.serviceIcon}>
                            {!!IconComp && <IconComp width={24} height={24} />}
                          </View>
                          <Text style={d.serviceName} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={d.emptyLine}>No services added yet.</Text>
                )}
              </View>

              <View style={d.section}>
                <View style={d.sectionHeader}>
                  <Text style={d.sectionTitle}>Starting packages</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit packages"
                    hitSlop={{top: 10, bottom: 10, left: 12, right: 12}}
                    onPress={() => navigation.navigate('ServiceThree')}>
                    <Text style={d.sectionLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {service?.packages?.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={d.rail}>
                    {service.packages.map((item: any, index: number) => (
                      <TouchableOpacity
                        key={item.id ?? index}
                        accessibilityRole="button"
                        accessibilityLabel={`Package ${item.id}, $${item.price}, view details`}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ServiceThree')}
                        style={[d.card, d.packageCard]}>
                        <Text style={d.packageName}>Package {item.id}</Text>
                        <Text style={d.packagePrice} numberOfLines={1}>
                          ${item.price}
                        </Text>
                        {!!item.details && (
                          <Text style={d.packageDetails} numberOfLines={2}>
                            {item.details}
                          </Text>
                        )}
                        <Text style={d.packageLink}>View details ›</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={d.emptyLine}>
                    No packages added yet. Packages are optional — add one
                    anytime.
                  </Text>
                )}
              </View>

              <View style={[d.card, d.textCard]}>
                <View style={d.sectionHeader}>
                  <Text style={d.cardTitle}>About my service</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit service description"
                    hitSlop={{top: 10, bottom: 10, left: 12, right: 12}}
                    onPress={() => navigation.navigate('ServiceOne')}>
                    <Text style={d.sectionLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={d.description}>
                  {cleanDescription
                    ? isExpanded
                      ? cleanDescription + ' '
                      : getTruncatedText(cleanDescription)
                    : 'No description added yet.'}
                  {cleanDescription.length > 100 && (
                    <Text onPress={toggleDescription} style={d.readMore}>
                      {isExpanded ? 'Read less' : 'Read more'}
                    </Text>
                  )}
                </Text>
              </View>

              {/* Availability, in the same card language */}
              <View style={[d.card, d.textCard]}>
                <View style={d.sectionHeader}>
                  <Text style={d.cardTitle}>Weekly availability</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit availability"
                    hitSlop={{top: 10, bottom: 10, left: 12, right: 12}}
                    onPress={() => navigation.navigate('Availability')}>
                    <Text style={d.sectionLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={d.week}>
                  {WEEK.map(day => {
                    const open = openDays.includes(day.key);
                    return (
                      <View
                        key={day.key}
                        accessibilityLabel={`${day.key} ${
                          open ? 'available' : 'unavailable'
                        }`}
                        style={[d.weekDay, open && d.weekDayOpen]}>
                        <Text style={[d.weekText, open && d.weekTextOpen]}>
                          {day.short}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {openDays.length ? (
                  <>
                    <View style={d.slots}>
                      {service.availability
                        .filter((item: any) => item.checked)
                        .map((item: any) => (
                          <View key={item.day} style={d.slotRow}>
                            <Text style={d.slotDay}>{item.day}</Text>
                            <Text style={d.slotTime}>
                              {formatTime(item.fromTime)} –{' '}
                              {formatTime(item.toTime)}
                            </Text>
                          </View>
                        ))}
                    </View>
                    <View style={d.nextRow}>
                      <Icon
                        name="calendar-clock"
                        size={16}
                        color={Colors.gradient1}
                      />
                      <Text style={d.nextText} numberOfLines={1}>
                        Next available: {availabilitySummary.nextAvailable}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={d.emptyLine}>
                    No availability set. Set your availability to start
                    receiving bookings.
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View style={[d.card, d.setupCard]}>
              <View style={d.setupIcon}>
                <Image source={Icons.dashBoard} style={d.setupImage} />
              </View>
              <Text style={d.setupTitle}>Stand out to customers</Text>
              <Text style={d.setupText}>
                Optional: add a description, the services you offer, photos and
                your availability to help customers choose you.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                style={d.setupButton}
                onPress={handleNext}
                disabled={loading2}>
                {loading2 ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={d.setupButtonText}>Set up services</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <CleanerCoachMarks
        visible={showCleanerCoachMarks}
        onSkip={handleSkipCleanerCoachMarks}
        onNext={handleNextCleanerCoachMarks}
      />

      <LocationDisclosureModal
        visible={disclosureVisible && locationModalAllowed}
        onAccept={acceptDisclosure}
        onDecline={declineDisclosure}
      />
    </View>
  );
};

export default Dashboard;

const WEEK = [
  {key: 'Mon', short: 'M'},
  {key: 'Tue', short: 'T'},
  {key: 'Wed', short: 'W'},
  {key: 'Thu', short: 'T'},
  {key: 'Fri', short: 'F'},
  {key: 'Sat', short: 'S'},
  {key: 'Sun', short: 'S'},
];

/** Dashboard v2: variant A on top (today + month), variant C below (listing). */
const d = StyleSheet.create({
  scroll: {paddingBottom: 32, backgroundColor: Colors.gray50, flexGrow: 1},
  grow: {flex: 1, minWidth: 0},
  band: {paddingHorizontal: 16, paddingBottom: 20, gap: 14},
  bandRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {width: '100%', height: '100%'},
  greeting: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    color: Colors.white,
  },
  name: {fontFamily: Fonts.semiBold, fontSize: 17, color: Colors.white},
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  adminText: {fontFamily: Fonts.semiBold, fontSize: 10.5, color: Colors.white},
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  visibilityDot: {width: 8, height: 8, borderRadius: 4},
  visibilityTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.white,
  },
  visibilityText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.white,
    marginTop: 2,
  },
  visibilityEdit: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.white,
  },
  body: {padding: 16, gap: 18},
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 14,
  },
  navRow: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  navValue: {fontFamily: Fonts.fontBold, fontSize: 18, color: Colors.slateText},
  navTitle: {fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.slateText},
  navSub: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    color: Colors.secondaryText,
  },
  loader: {alignSelf: 'flex-start', marginTop: 6},
  section: {gap: 10},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.slateText,
  },
  sectionLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.gradient1,
  },
  rail: {gap: 10, paddingRight: 4},
  serviceItem: {width: 82, alignItems: 'center', gap: 6},
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontFamily: Fonts.fontMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: Colors.slateText,
    textAlign: 'center',
  },
  packageCard: {width: 170, padding: 12, gap: 4},
  packageName: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  packagePrice: {
    fontFamily: Fonts.fontBold,
    fontSize: 18,
    color: Colors.slateText,
  },
  packageDetails: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.secondaryText,
  },
  packageLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.gradient1,
    marginTop: 4,
  },
  textCard: {padding: 14, gap: 10},
  cardTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.slateText,
  },
  description: {
    fontFamily: Fonts.fontRegular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.secondaryText,
  },
  readMore: {fontFamily: Fonts.semiBold, color: Colors.gradient1},
  emptyLine: {
    fontFamily: Fonts.fontRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.secondaryText,
  },
  week: {flexDirection: 'row', gap: 4},
  weekDay: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayOpen: {backgroundColor: Colors.gradient1},
  weekText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  weekTextOpen: {color: Colors.white},
  slots: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: 4,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  slotDay: {
    fontFamily: Fonts.fontMedium,
    fontSize: 13,
    color: Colors.slateText,
  },
  slotTime: {
    fontFamily: Fonts.fontRegular,
    fontSize: 13,
    color: Colors.secondaryText,
    fontVariant: ['tabular-nums'],
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.blueBg200,
  },
  nextText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: 12.5,
    color: Colors.gradient1,
  },
  setupCard: {padding: 20, alignItems: 'center', gap: 10},
  setupIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.blueBg200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupImage: {width: 28, height: 28, resizeMode: 'contain'},
  setupTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.slateText,
  },
  setupText: {
    fontFamily: Fonts.fontRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  setupButton: {
    marginTop: 4,
    minHeight: 46,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.white,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Intro video card — mirrors the earnings card so the two read as one system.
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },

  // ---- Admin Controls entry card (admin only) ----
});
