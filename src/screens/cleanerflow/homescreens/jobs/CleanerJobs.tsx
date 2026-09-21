import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar,
  Keyboard,
} from 'react-native';
import React, {useCallback, useState, useRef, useEffect, useMemo} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import {NEARBY_RADIUS_MILES} from '../../../../constants/nearbyRadius';
import HeaderBack from '../../../../components/HeaderBack';
import JobCard from '../../../../components/JobCard';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SearchField from '../../../../components/SearchField';
import Slider from '@react-native-community/slider';
import NotFound from '../../../../components/NotFound';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import {useCurrentLocation} from '../../../../utils/userLocation';
import LocationDisclosureModal from '../../../../components/LocationDisclosureModal';
import {useSelector, useDispatch} from 'react-redux';
import haversine from 'haversine';
import {clearFilterLocation} from '../../../../redux/location/Actions';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LocationIcon from '../../../../assets/svg/LocationIcon';
import DollarIcon from '../../../../assets/svg/DollarIcon';
import TypeIcon from '../../../../assets/svg/TypeIcon';

const {width} = Dimensions.get('window');

const items = [
  'Residential Cleaning',
  'Car Cleaning',
  'Window Cleaning',
  'Pressure Washing',
  'Carpet Cleaning',
  'Chimney Cleaning',
  'Lawn Care',
  'Others',
];

type Job = {
  id: string;
  title?: string;
  status?: string;
  priceRange?: number;
  type?: string;
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt?: any;
};

const CleanerJobs = () => {
  const profileData = useSelector((state: any) => state?.profile.profileData);

  const {
    location,
    locationSource,
    resolving: resolvingLocation,
    error: locationError,
    failure: locationFailure,
    permissionBlocked,
    refresh: refreshLocation,
    openAppSettings,
    disclosureVisible,
    acceptDisclosure,
    declineDisclosure,
  } = useCurrentLocation({savedLocationFallback: true});
  const navigation = useNavigation<any>();
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [loading2, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [rangeSelector, setRangeSelector] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [loactionLoading, setLocationLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [serviceType, setServiceType] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [query2, setQuery2] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(profileData?.admin);
  const [adminViewAllJobs, setAdminViewAllJobs] = useState(false);

  const selectedLocation = useSelector(
    (state: any) =>
      state?.location?.filterLocation ?? {
        latitude: null,
        longitude: null,
        name: '',
      },
  );
  const dispatch = useDispatch();
  useExitAppOnBack();

  // Fetching jobs
  const fetchJobs = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Jobs')
        .where('status', '==', 'active')
        .get();

      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobsData(jobs);
    } catch (error) {
      console.log('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Pull-to-refresh previously refetched jobs only, so a failed location
   * lookup had no in-app retry at all — the user had to kill the app. Both are
   * retried together now.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchJobs(), refreshLocation()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchJobs, refreshLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs]),
  );

  const getTruncatedText = (text: any) => {
    const maxChars = 23;
    const textStr = String(text || '');
    if (textStr?.length <= maxChars) return textStr;
    return textStr?.slice(0, maxChars).trim() + '... ';
  };

  const getTruncatedText2 = (text: any) => {
    const maxChars = 30;
    const textStr = String(text || '');
    if (textStr?.length <= maxChars) return textStr;
    return textStr?.slice(0, maxChars).trim() + '... ';
  };

  useEffect(() => {
    if (modalVisible2 || modalVisible3) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible2, modalVisible3]);

  const handlePriceRangeApply = () => {
    setPriceLoading(true);
    setTimeout(() => {
      setPriceLoading(false);
      setModalVisible2(false);
      setRangeSelector(true);
    }, 1500);
  };

  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>([]);

  const handleSearch2 = (query: string) => {
    setQuery2(query);
    const filtered = items.filter(item =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
    setServiceTypeFilter(filtered);
  };

  const handleServiceTypeApply = () => {
    setLocationLoading(true);
    setTimeout(() => {
      setLocationLoading(false);
      setModalVisible3(false);
      setServiceType(true);
    }, 1500);
  };

  /**
   * One resolved position for the whole screen. A manually chosen filter still
   * wins over the device position (unchanged), and `location` may itself be a
   * saved fallback rather than a GPS fix — see useCurrentLocation.
   */
  const hasSelectedLocation = !!(
    selectedLocation?.latitude && selectedLocation?.longitude
  );
  const hasCurrentLocation = !!(location?.latitude && location?.longitude);
  const activePosition = hasSelectedLocation
    ? selectedLocation
    : hasCurrentLocation
    ? location
    : null;

  const finalFilteredJobs = jobsData.filter(job => {
    if (job.status !== 'active') return false;

    if (isAdmin && adminViewAllJobs) {
      if (rangeSelector) {
        const price = job?.priceRange || 0;
        if (price < 0 || price > priceRange[0]) return false;
      }
      if (serviceType && selectedType) {
        const jobType = job?.type?.toLowerCase().trim();
        const selectedTypeLower = selectedType.toLowerCase().trim();
        if (jobType !== selectedTypeLower) return false;
      }

      return true; // 👈 Admin sees everything else
    }

    if (!activePosition) return false;

    if (rangeSelector) {
      const price = job?.priceRange || 0;
      if (price < 0 || price > priceRange[0]) return false;
    }

    if (serviceType && selectedType) {
      const jobType = job?.type?.toLowerCase().trim();
      const selectedTypeLower = selectedType.toLowerCase().trim();
      if (jobType !== selectedTypeLower) return false;
    }

    // Distance check
    const jobLoc = job?.location;
    if (!jobLoc?.latitude || !jobLoc?.longitude) return false;

    try {
      const distance = haversine(
        {
          latitude: activePosition.latitude,
          longitude: activePosition.longitude,
        },
        {latitude: jobLoc.latitude, longitude: jobLoc.longitude},
        {unit: 'mile'},
      );
      return distance <= NEARBY_RADIUS_MILES;
    } catch (e) {
      return false;
    }
  });

  const [showAllJobs, setShowAllJobs] = useState(false);

  const sortedJobs = finalFilteredJobs?.sort(
    (a, b) => b?.createdAt?.toDate?.() - a?.createdAt?.toDate?.(),
  );

  const displayedJobs = showAllJobs ? sortedJobs : sortedJobs?.slice(0, 10);

  const noLocation = !activePosition;

  /**
   * All five failure paths used to collapse into the same "Location Required /
   * please apply a location filter" message, which blamed the user for what
   * was usually a blocked permission or a timed-out fix and offered no way
   * out. Each case now names itself and carries the action that resolves it.
   */
  const locationEmptyState = permissionBlocked
    ? {
        icon: 'location-disabled',
        title: 'Location Access Is Off',
        message:
          'CleanersChoice needs your location to show jobs near you.\nTurn it back on in Settings, or pick a location manually.',
        actionLabel: 'Open Settings',
        onAction: openAppSettings,
      }
    : locationError
    ? {
        icon: 'location-searching',
        title: "Couldn't Get Your Location",
        message: locationError,
        actionLabel: 'Try Again',
        onAction: refreshLocation,
      }
    : {
        icon: 'location-off',
        title: 'Location Required',
        message:
          'Allow location access or pick a location to see\ncleaning jobs near you.',
        actionLabel: 'Try Again',
        onAction: refreshLocation,
      };

  /**
   * Permission CTA, deliberately NOT gated on `noLocation`.
   *
   * With savedLocationFallback on, a denied permission still resolves to the
   * cleaner's last known position or service address, so `activePosition` is
   * set and `noLocation` is false -- which meant the empty state below (the
   * only thing carrying "Open Settings") never rendered. The cleaner got jobs
   * around a stale address and no way to turn location back on. This banner
   * shows whenever the permission itself is the problem, with or without a
   * usable fallback.
   *
   * "blocked" is the Settings case: neither OS will prompt again (iOS after
   * any denial, Android after "Don't ask again"). "denied" on Android can
   * still be re-prompted in-app, so it gets a different action.
   */
  const permissionPrompt = useMemo(() => {
    if (permissionBlocked) {
      return {
        title: 'Location Access Is Off',
        message: hasSelectedLocation
          ? 'Turn it on to see jobs around you instead of your chosen filter.'
          : activePosition
          ? "Jobs below aren't centred on where you are right now."
          : 'CleanersChoice needs your location to show jobs near you.',
        actionLabel: 'Open Settings',
        onAction: openAppSettings,
      };
    }
    if (locationFailure === 'denied') {
      return {
        title: 'Location Permission Needed',
        message: 'Allow location access to see cleaning jobs near you.',
        actionLabel: 'Allow Location',
        onAction: refreshLocation,
      };
    }
    return null;
  }, [
    permissionBlocked,
    locationFailure,
    hasSelectedLocation,
    activePosition,
    openAppSettings,
    refreshLocation,
  ]);

  // A saved fallback keeps the list populated, but the cleaner needs to know
  // the results are not centred on where they actually are right now.
  const fallbackNotice =
    !hasSelectedLocation && locationSource === 'serviceAddress'
      ? 'Showing jobs near your saved service address. Turn on location for jobs around you right now.'
      : !hasSelectedLocation && locationSource === 'lastKnown'
      ? 'Showing jobs near your last known location.'
      : null;

  /**
   * Location is no longer allowed to take the whole screen hostage.
   *
   * The old early return replaced the header, filters and jobs list with a
   * bare spinner for as long as `resolving` was true, so a stalled native
   * authorization callback read as a permanently broken screen — and the
   * "Choose a Location" button it rendered sat outside `locationActions`,
   * which is where that button gets its width and padding, so it came out
   * unstyled. The screen now always renders; location state is expressed
   * inside the jobs section, where the properly laid out empty state and the
   * location filter in the header are both reachable the whole time.
   */
  const locationPending = resolvingLocation && noLocation;

  /**
   * The ONLY case where location state should be hidden: an admin who has
   * switched the list to every job platform-wide, so no coordinate is used.
   *
   * These branches previously tested `!isAdmin`, which was wrong -- and
   * silently so. `adminViewAllJobs` defaults to false and `setAdminViewAllJobs`
   * is never called (the toggle UI at the top of this file is commented out),
   * so an admin is filtered by distance exactly like any cleaner while every
   * location affordance -- the resolving spinner, the empty state, and the
   * permission CTA -- was suppressed for them. The result was an admin with a
   * blocked permission landing on "No cleaning jobs found matching your
   * filters" with no hint that location was the actual problem and no way to
   * fix it.
   */
  const adminBypassesLocation = isAdmin && adminViewAllJobs;

  // Why the screen is showing what it is showing. Release-stripped by
  // configureConsole(), so this costs nothing in production.
  useEffect(() => {
    console.log(
      '[CleanerJobs] location state ->',
      JSON.stringify({
        failure: locationFailure,
        permissionBlocked,
        source: locationSource,
        hasPosition: !noLocation,
        manualFilter: hasSelectedLocation,
        resolving: resolvingLocation,
        isAdmin: !!isAdmin,
        adminViewAllJobs,
        adminBypassesLocation,
        showingPermissionCta: !!permissionPrompt && !adminBypassesLocation,
      }),
    );
  }, [
    locationFailure,
    permissionBlocked,
    locationSource,
    noLocation,
    hasSelectedLocation,
    resolvingLocation,
    isAdmin,
    adminViewAllJobs,
    adminBypassesLocation,
    permissionPrompt,
  ]);

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
          title="Available Jobs"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={Colors.white}
        />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filter Jobs</Text>
          <Text style={styles.sectionSubtitle}>
            Narrow down your job search
          </Text>

          <View style={styles.filtersContainer}>
            {/* Location Filter */}
            <View style={styles.filterItem}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('Location', {location: false});
                }}
                style={[
                  styles.filterButton,
                  selectedLocation?.name && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    selectedLocation?.name
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['rgba(84, 137, 255, 0.05)', 'rgba(84, 137, 255, 0.05)']
                  }
                  style={styles.filterGradient}>
                  <View
                    style={[
                      styles.filterIconContainer,
                      selectedLocation?.name && styles.locationFilterIconActive,
                    ]}>
                    <LocationIcon
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      color={selectedLocation?.name ? '#FFFFFF' : Colors.gradient1}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedLocation?.name && styles.filterButtonTextActive,
                    ]}>
                    Location
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {selectedLocation?.name && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => dispatch(clearFilterLocation())}
                  style={styles.removeFilter}>
                  <AntDesign name="closecircle" size={16} color={Colors.slate400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterItem}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible2(true)}
                style={[
                  styles.filterButton,
                  rangeSelector && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    rangeSelector
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['rgba(84, 137, 255, 0.05)', 'rgba(84, 137, 255, 0.05)']
                  }
                  style={styles.filterGradient}>
                  <View
                    style={[
                      styles.filterIconContainer,
                      rangeSelector && styles.locationFilterIconActive,
                    ]}>
                    <DollarIcon
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      color={rangeSelector ? '#FFFFFF' : Colors.gradient1}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterButtonText,
                      rangeSelector && styles.filterButtonTextActive,
                    ]}>
                    Price
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {rangeSelector && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setRangeSelector(false)}
                  style={styles.removeFilter}>
                  <AntDesign name="closecircle" size={16} color={Colors.slate400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Service Type Filter */}
            <View style={styles.filterItem}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setQuery2('');
                  setServiceTypeFilter([]);
                  setSelectedType('');
                  setModalVisible3(true);
                }}
                style={[
                  styles.filterButton,
                  serviceType && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    serviceType
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['rgba(84, 137, 255, 0.05)', 'rgba(84, 137, 255, 0.05)']
                  }
                  style={styles.filterGradient}>
                  <View
                    style={[
                      styles.filterIconContainer,
                      serviceType && styles.locationFilterIconActive,
                    ]}>
                    <TypeIcon
                      width={RFPercentage(2.4)}
                      height={RFPercentage(2.4)}
                      color={serviceType ? '#FFFFFF' : Colors.gradient1}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterButtonText,
                      serviceType && styles.filterButtonTextActive,
                    ]}>
                    Type
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {serviceType && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setServiceType(false)}
                  style={styles.removeFilter}>
                  <AntDesign name="closecircle" size={16} color={Colors.slate400} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Active Filters Info */}
        {(selectedLocation?.name || rangeSelector || serviceType) && (
          <View style={styles.activeFiltersCard}>
            <Text style={styles.activeFiltersTitle}>Active Filters</Text>
            <View style={styles.activeFiltersList}>
              {selectedLocation?.name && (
                <View style={styles.activeFilterTag}>
                  <LocationIcon
                    width={18}
                    height={18}
                    color={Colors.gray700}
                    strokeWidth={2}
                  />
                  <Text style={styles.activeFilterText}>
                    {selectedLocation.name}
                  </Text>
                </View>
              )}
              {rangeSelector && (
                <View style={styles.activeFilterTag}>
                  <DollarIcon
                    width={18}
                    height={18}
                    color={Colors.gray700}
                    strokeWidth={2}
                  />
                  <Text style={styles.activeFilterText}>
                    ${priceRange[0]}
                  </Text>
                </View>
              )}
              {serviceType && (selectedType || query2) && (
                <View style={styles.activeFilterTag}>
                  <TypeIcon
                    width={18}
                    height={18}
                    color={Colors.gray700}
                  />
                  <Text style={styles.activeFilterText}>
                    {selectedType || query2}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* {isAdmin && (
          <View style={styles.adminToggleSection}>
            <View style={styles.adminToggleCard}>
              <View style={styles.adminToggleHeader}>
                <View style={styles.adminBadge}>
                  <MaterialIcons
                    name="admin-panel-settings"
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.adminBadgeText}>Admin Mode</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAdminViewAllJobs(prev => !prev)}
                  style={[
                    styles.toggleSwitch,
                    adminViewAllJobs && styles.toggleSwitchActive,
                  ]}>
                  <View
                    style={[
                      styles.toggleCircle,
                      adminViewAllJobs && styles.toggleCircleActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.adminToggleRow}>
                <View style={styles.adminToggleInfo}>
                  <MaterialIcons name="public" size={20} color={Colors.gray600} />
                  <View style={styles.adminToggleTextContainer}>
                    <Text style={styles.adminToggleTitle}>View All Jobs</Text>
                    <Text style={styles.adminToggleDescription}>
                      {adminViewAllJobs
                        ? 'Viewing all active jobs'
                        : 'Viewing jobs by location filter'}
                    </Text>
                  </View>
                </View>
              </View>

              {adminViewAllJobs && (
                <View style={styles.adminStats}>
                  <View style={styles.adminStatItem}>
                    <Text style={styles.adminStatNumber}>
                      {jobsData.filter(job => job.status === 'active').length}
                    </Text>
                    <Text style={styles.adminStatLabel}>Total Active Jobs</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )} */}

        {/* Jobs Section */}
        <View style={[styles.jobsSection, isAdmin && styles.jobsSectionWithAdmin]}>
          <View style={styles.jobsHeader}>
            <View style={styles.jobsTitleContainer}>
              <Text
                style={styles.jobsTitle}
                numberOfLines={1}
                ellipsizeMode="tail">
                {isAdmin && adminViewAllJobs
                  ? 'All Active Jobs'
                  : selectedLocation?.name
                  ? `Jobs in ${selectedLocation.name}`
                  : 'Nearby Cleaning Jobs'}
              </Text>
            </View>
            {!noLocation && !locationPending && (
              <View style={styles.jobsCount}>
                <Text style={styles.jobsCountText}>
                  {sortedJobs?.length} Job
                  {sortedJobs?.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {permissionPrompt && !adminBypassesLocation && (
            <View style={styles.permissionCard}>
              <View style={styles.permissionIconWrap}>
                <MaterialIcons
                  name="location-disabled"
                  size={RFPercentage(2.6)}
                  color={Colors.gradient1}
                />
              </View>
              <View style={styles.permissionTextWrap}>
                <Text style={styles.permissionTitle}>
                  {permissionPrompt.title}
                </Text>
                <Text style={styles.permissionMessage}>
                  {permissionPrompt.message}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={permissionPrompt.actionLabel}
                activeOpacity={0.8}
                style={styles.permissionButton}
                onPress={permissionPrompt.onAction}>
                <Text style={styles.permissionButtonText}>
                  {permissionPrompt.actionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Softer notice only when permission is not already being asked about. */}
          {fallbackNotice && !noLocation && !permissionPrompt && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={permissionBlocked ? openAppSettings : refreshLocation}
              style={styles.fallbackBanner}>
              <MaterialIcons
                name="info-outline"
                size={RFPercentage(2)}
                color={Colors.gradient1}
              />
              <Text style={styles.fallbackBannerText}>{fallbackNotice}</Text>
            </TouchableOpacity>
          )}

          {locationPending && !adminBypassesLocation ? (
            <View style={styles.loadingJobsContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingJobsText}>
                Finding jobs near you...
              </Text>
              <Text style={styles.loadingJobsHint}>
                Using the location filter above works too.
              </Text>
            </View>
          ) : loading2 ? (
            <View style={styles.loadingJobsContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingJobsText}>Loading jobs...</Text>
            </View>
          ) : noLocation && !adminBypassesLocation ? (
            <View style={styles.noLocationContainer}>
              <MaterialIcons
                name={locationEmptyState.icon}
                size={RFPercentage(8)}
                color={Colors.slate300}
              />
              <Text style={styles.noLocationTitle}>
                {locationEmptyState.title}
              </Text>
              <Text style={styles.noLocationText}>
                {locationEmptyState.message}
              </Text>

              <View style={styles.locationActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.locationPrimaryButton}
                  onPress={locationEmptyState.onAction}>
                  <Text style={styles.locationPrimaryText}>
                    {locationEmptyState.actionLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.locationSecondaryButton}
                  onPress={() =>
                    navigation.navigate('Location', {location: false})
                  }>
                  <Text style={styles.locationSecondaryText}>
                    Choose a Location
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : displayedJobs?.length === 0 ? (
            <View style={styles.noJobsContainer}>
              <NotFound
                text={`No cleaning jobs found\nmatching your filters`}
              />
            </View>
          ) : (
            <>
              <FlatList
                scrollEnabled={false}
                data={displayedJobs}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <JobCard
                    name={getTruncatedText(item.title)}
                    location={item.location?.name || 'Location not specified'}
                    price={getTruncatedText2(item.priceRange)}
                    date={item.createdAt}
                    onPress={() =>
                      navigation.navigate('JobDetails', {item: item})
                    }
                    delete={false}
                  />
                )}
                contentContainerStyle={styles.jobsList}
              />
              {sortedJobs?.length > 10 && (
                <TouchableOpacity
                  onPress={() => setShowAllJobs(prev => !prev)}
                  style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>
                    {showAllJobs ? 'Show Less Jobs' : 'View All Jobs'}
                  </Text>
                  <MaterialIcons
                    name={showAllJobs ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={Colors.gradient1}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Price Range Modal */}
      {modalVisible2 && (
        <>
          <TouchableWithoutFeedback onPress={() => setModalVisible2(false)}>
            <View style={styles.modalOverlay}>
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={5}
              />
              <Modal
                visible={modalVisible2}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible2(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{flex: 1}}>
                  <Animated.View
                    style={[
                      {
                        opacity: opacityAnim,
                        transform: [{scale: scaleAnim}],
                      },
                      styles.priceModal,
                    ]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <View style={styles.modalIconContainer}>
                        <MaterialIcons
                          name="attach-money"
                          size={24}
                          color={Colors.gradient1}
                        />
                      </View>
                      <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitle}>Set Price Range</Text>
                        <Text style={styles.modalSubtitle}>
                          Drag to adjust maximum price
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.modalCloseButton}
                        onPress={() => setModalVisible2(false)}>
                        <AntDesign name="close" size={22} color={Colors.placeholderColor} />
                      </TouchableOpacity>
                    </View>

                    {/* Price Display */}
                    <View style={styles.priceDisplayCard}>
                      <Text style={styles.priceLabel}>Maximum Price</Text>
                      <Text style={styles.priceValue}>
                        ${tempValue.current}
                      </Text>
                      <Text style={styles.priceHint}>
                        Jobs below this price will be shown
                      </Text>
                    </View>

                    {/* Slider */}
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={10}
                        maximumValue={2000}
                        step={10}
                        value={priceRange[0]}
                        onValueChange={value => {
                          tempValue.current = value;
                        }}
                        onSlidingComplete={value => {
                          setPriceRange([value, priceRange[1]]);
                        }}
                        minimumTrackTintColor={Colors.gradient1}
                        thumbTintColor={Colors.gradient1}
                        maximumTrackTintColor={Colors.gray200}
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.sliderMin}>$10</Text>
                        <Text style={styles.sliderMax}>$2000+</Text>
                      </View>
                    </View>

                    {/* Apply Button */}
                    <View style={styles.modalButtonContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.applyButton}
                        onPress={handlePriceRangeApply}
                        disabled={priceLoading}>
                        <LinearGradient
                          colors={[Colors.gradient1, Colors.gradient2]}
                          style={styles.applyButtonGradient}>
                          {priceLoading ? (
                            <ActivityIndicator color={Colors.white} />
                          ) : (
                            <>
                              <Text style={styles.applyButtonText}>
                                Apply Filter
                              </Text>
                              <AntDesign
                                name="check"
                                size={18}
                                color={Colors.white}
                              />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </KeyboardAvoidingView>
              </Modal>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}

      {/* Service Type Modal */}
      {modalVisible3 && (
        <View style={styles.modalOverlay}>
          <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
          <Modal
            visible={modalVisible3}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible3(false)}>
            <Animated.View
              style={[styles.serviceModal, {opacity: opacityAnim}]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <MaterialIcons
                    name="cleaning-services"
                    size={24}
                    color={Colors.gradient1}
                  />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Select Service Type</Text>
                  <Text style={styles.modalSubtitle}>
                    Choose a specific cleaning service
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible3(false)}>
                  <AntDesign name="close" size={22} color={Colors.placeholderColor} />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.searchContainer}>
                <SearchField
                  placeholder="Search service types..."
                  customStyle={styles.searchInput}
                  value={query2}
                  onChangeText={handleSearch2}
                />
              </View>

              {/* Service Type Results */}
              {query2?.length > 0 ? (
                selectedType?.length === 0 && (
                  <View style={styles.resultsContainer}>
                    {serviceTypeFilter.length > 0 ? (
                      <FlatList
                        data={serviceTypeFilter}
                        keyboardShouldPersistTaps="always"
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        style={styles.resultsList}
                        renderItem={({item}) => (
                          <TouchableOpacity
                            style={styles.resultItem}
                            onPress={() => {
                              setQuery2(item);
                              setSelectedType(item);
                              Keyboard.dismiss();
                            }}>
                            <MaterialIcons
                              name="check-circle-outline"
                              size={20}
                              color={Colors.gray400}
                            />
                            <Text style={styles.resultText}>{item}</Text>
                            <AntDesign name="right" size={16} color={Colors.gray400} />
                          </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => (
                          <View style={styles.separator} />
                        )}
                      />
                    ) : (
                      <View style={styles.noResults}>
                        <MaterialIcons
                          name="search-off"
                          size={RFPercentage(5)}
                          color={Colors.slate300}
                        />
                        <Text style={styles.noResultsTitle}>
                          No services found
                        </Text>
                        <Text style={styles.noResultsText}>
                          Try searching for something else
                        </Text>
                      </View>
                    )}
                  </View>
                )
              ) : (
                // Show this when no query has been entered yet
                <View style={styles.emptySearchContainer}>
                  <Text style={styles.emptySearchTitle}>
                    Refine Your Search
                  </Text>
                  <Text style={styles.emptySearchText}>
                    Type in the search box above to find specific cleaning
                    services
                  </Text>
                  <View style={styles.searchTips}>
                    <View style={styles.tipItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.tipText}>Search by service type</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.tipText}>
                        Browse available categories
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.tipText}>
                        Select one to apply filter
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Selected Type - Keep this outside so it shows even when no query */}
              {selectedType?.length > 0 && (
                <View style={styles.selectedTypeContainer}>
                  <Text style={styles.selectedTypeLabel}>
                    Selected Service:
                  </Text>
                  <View style={styles.selectedTypeCard}>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text style={styles.selectedTypeText}>{selectedType}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedType('');
                        setQuery2('');
                      }}>
                      <AntDesign name="close" size={16} color={Colors.slate400} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* Apply Button */}
              <View style={[styles.modalButtonContainer]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.applyButton,
                    query2?.length === 0 && styles.buttonDisabled,
                  ]}
                  onPress={handleServiceTypeApply}
                  disabled={query2?.length === 0 || loactionLoading}>
                  <LinearGradient
                    colors={[Colors.gradient1, Colors.gradient2]}
                    style={styles.applyButtonGradient}>
                    {loactionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Text style={styles.applyButtonText}>Apply Filter</Text>
                        <AntDesign name="check" size={18} color={Colors.white} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Modal>
        </View>
      )}

      {/*
        Sole mount point now that the blocking early return is gone. That
        branch had to carry its own copy, because a first-run cleaner is
        "resolving" precisely because this modal is waiting on them — leaving
        it only down here stranded them on the spinner with nothing to answer.
        The main tree always renders now, so one copy is enough.
      */}
      <LocationDisclosureModal
        visible={disclosureVisible}
        onAccept={acceptDisclosure}
        onDecline={declineDisclosure}
      />
    </View>
  );
};

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
    // elevation: 8,
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
    justifyContent: 'space-between',
  },
  filterItem: {
    position: 'relative',
  },
  filterButton: {
    width: (width - 60) / 3,
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
  },
  filterIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.filterIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationFilterIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  removeFilter: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 2,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation: 2,
  },
  activeFiltersCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#407BFF0D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  activeFiltersTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray800,
    marginBottom: 12,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#407BFF1A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeFilterText: {
    fontSize: RFPercentage(1.55),
    fontFamily: Fonts.fontRegular,
    color: Colors.gray600,
  },
  jobsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  jobsSectionWithAdmin: {
    marginTop: 24,
  },
  jobsHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  jobsTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
    width: '100%',
  },
  jobsCount: {
    backgroundColor: Colors.indigoBg50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  jobsCountText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  loadingJobsContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingJobsText: {
    marginTop: 12,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.placeholderColor,
  },
  loadingJobsHint: {
    marginTop: 4,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.slate300,
    textAlign: 'center',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLocationTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationActions: {
    marginTop: 20,
    width: '100%',
    gap: 10,
    paddingHorizontal: 24,
  },
  locationPrimaryButton: {
    backgroundColor: Colors.gradient1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationPrimaryText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  locationSecondaryButton: {
    backgroundColor: Colors.blueBg200,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    paddingVertical: 13,
    // Horizontal padding lives here rather than only on the `locationActions`
    // wrapper, so the button stays legible if it is ever rendered on its own.
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  locationSecondaryText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  permissionCard: {
    backgroundColor: Colors.blueBg150,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 14,
    padding: RFPercentage(1.8),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1.2),
  },
  permissionIconWrap: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(2.3),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTextWrap: {
    gap: 4,
  },
  permissionTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },
  permissionMessage: {
    fontSize: RFPercentage(1.55),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.2),
  },
  permissionButton: {
    backgroundColor: Colors.gradient1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  permissionButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.blueBg150,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  fallbackBannerText: {
    flex: 1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.grayBlueText,
    lineHeight: 19,
  },
  noJobsContainer: {
    // paddingVertical: 40,
    bottom: 40,
  },
  jobsList: {
    paddingBottom: 16,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blueBg50,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  viewMoreText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  modalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  priceModal: {
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginTop: '50%',
    shadowColor: Colors.navyShadow,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  serviceModal: {
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,

    maxHeight: '80%',
    minHeight: 500,

    marginTop: 'auto',
    marginBottom: 'auto',

    shadowColor: Colors.navyShadow,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.indigoBg50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  modalCloseButton: {
    padding: 4,
  },
  priceDisplayCard: {
    backgroundColor: Colors.blueBg50,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.placeholderColor,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: RFPercentage(3.1),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 8,
  },
  priceHint: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.gray400,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderMin: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  sliderMax: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  searchContainer: {
    // marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  searchInput: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
    width: '100%',
  },
  resultsContainer: {
    flex: 1,
    minHeight: 200,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  resultText: {
    flex: 1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: 16,
  },
  noResults: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.gray400,
  },
  selectedTypeContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  selectedTypeLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.placeholderColor,
    marginBottom: 8,
  },
  selectedTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenBg50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.greenBg100,
    gap: 12,
  },
  selectedTypeText: {
    flex: 1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.green800,
  },
  modalButtonContainer: {
    marginTop: 8,
  },
  applyButton: {
    borderRadius: 100,
    overflow: 'hidden',
    width: RFPercentage(20),
    alignSelf: 'center',
    height: RFPercentage(5.6),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  applyButtonGradient: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
  },
  applyButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },

  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    marginVertical: 16,
  },
  emptySearchTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  searchTips: {
    width: '100%',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },

  noResultsTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
    marginTop: 12,
    marginBottom: 4,
  },
  adminToggleSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  adminToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success, // Purple color for admin
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.white,
  },
  adminToggleCard: {
    backgroundColor: Colors.adminCardBg, // Light purple background
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.purple100,
  },
  adminToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminToggleTextContainer: {
    flex: 1,
  },
  adminToggleTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray800,
    marginBottom: 2,
  },
  adminToggleDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  toggleSwitch: {
    width: 46,
    height: 22,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    padding: 2,
    justifyContent: 'center',
    marginRight: 3,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.success,
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  adminStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  adminStatItem: {
    alignItems: 'center',
  },
  adminStatNumber: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.success,
    marginBottom: 4,
  },
  adminStatLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },

  // Updated styles for jobs header
  jobsTitleContainer: {
    flex: 1,
  },
  adminIndicator: {
    color: Colors.violet500,
    fontSize: RFPercentage(1.5),
  },
  adminSubtitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    marginTop: 2,
  },
});

export default CleanerJobs;
