import {
  SafeAreaView,
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
} from 'react-native';
import React, {useCallback, useState, useRef, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import JobCard from '../../../../components/JobCard';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Icons} from '../../../../constants/Themes';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GradientButton from '../../../../components/GradientButton';
import SearchField from '../../../../components/SearchField';
import Slider from '@react-native-community/slider';
import NotFound from '../../../../components/NotFound';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import {useCurrentLocation} from '../../../../utils/userLocation';
import {useSelector, useDispatch} from 'react-redux';
import haversine from 'haversine';
import {clearFilterLocation} from '../../../../redux/location/Actions';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

const CleanerJobs = () => {
  const {location, loading, error} = useCurrentLocation();
  const navigation = useNavigation<any>();
  const [jobsData, setJobsData] = useState([]);
  const [loading2, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [modalVisible, setModalVisible] = useState(false);
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
  const [initializingLocation, setInitializingLocation] = useState(true);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializingLocation(false);
    }, 2000);

    if (location && location.latitude && location.longitude) {
      clearTimeout(timer);
      setInitializingLocation(false);
    }

    return () => clearTimeout(timer);
  }, [location]);

  // On Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchJobs();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1500);
  };

  // Fetching jobs
  const fetchJobs = async () => {
    const user = auth().currentUser;
    if (!user) return;
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, []),
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

  const [serviceTypeFilter, setServiceTypeFilter] = useState([]);

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

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  const finalFilteredJobs = jobsData.filter(job => {
    // Price filter
    if (rangeSelector) {
      const price = job?.priceRange || 0;
      if (price < 0 || price > priceRange[0]) {
        return false;
      }
    }

    // Service type filter
    if (serviceType && selectedType) {
      const jobType = job.type?.toLowerCase().trim();
      const selectedTypeLower = selectedType.toLowerCase().trim();
      if (jobType !== selectedTypeLower) {
        return false;
      }
    }

    // Location filtering logic
    const hasSelectedLocation =
      selectedLocation?.latitude && selectedLocation?.longitude;
    const hasCurrentLocation = location?.latitude && location?.longitude;

    if (hasSelectedLocation) {
      if (job?.location?.latitude && job?.location?.longitude) {
        try {
          const distance = haversine(
            {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            },
            {
              latitude: job.location.latitude,
              longitude: job.location.longitude,
            },
            {unit: 'km'},
          );
          return distance <= 20;
        } catch (error) {
          return true;
        }
      } else {
        return false;
      }
    }
    if (hasCurrentLocation) {
      if (job?.location?.latitude && job?.location?.longitude) {
        try {
          const distance = haversine(
            {latitude: location.latitude, longitude: location.longitude},
            {
              latitude: job.location.latitude,
              longitude: job.location.longitude,
            },
            {unit: 'km'},
          );
          return distance <= 20;
        } catch (error) {
          return true;
        }
      } else {
        return false;
      }
    }
    return true;
  });

  const [showAllJobs, setShowAllJobs] = useState(false);

  const sortedJobs = finalFilteredJobs?.sort(
    (a, b) => b?.createdAt?.toDate?.() - a?.createdAt?.toDate?.(),
  );

  const displayedJobs = showAllJobs ? sortedJobs : sortedJobs?.slice(0, 10);

  // Determine if no location exists
  const noLocation =
    (!location?.latitude || !location?.longitude) &&
    (!selectedLocation?.latitude || !selectedLocation?.longitude);

  if (initializingLocation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
          <Text style={styles.loadingText}>Fetching your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="light-content" />

      {/* Modern Header */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Available Jobs"
          textStyle={styles.headerText}
          left={true}
          arrowColor="#FFFFFF"
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={'white'}
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
                      : ['#FFFFFF', '#dae2f6ff']
                  }
                  style={styles.filterGradient}>
                  <View style={styles.filterIconContainer}>
                    <Ionicons
                      name="location"
                      size={RFPercentage(2)}
                      color={Colors.gradient1}
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
                  <AntDesign name="closecircle" size={16} color="#94A3B8" />
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
                      : ['#FFFFFF', '#dae2f6ff']
                  }
                  style={styles.filterGradient}>
                  <View style={styles.filterIconContainer}>
                    <MaterialIcons
                      name="attach-money"
                      size={RFPercentage(2)}
                      color={Colors.gradient1}
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
                  <AntDesign name="closecircle" size={16} color="#94A3B8" />
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
                      : ['#FFFFFF', '#dae2f6ff']
                  }
                  style={styles.filterGradient}>
                  <View style={styles.filterIconContainer}>
                    <MaterialIcons
                      name="cleaning-services"
                      size={RFPercentage(2)}
                      color={Colors.gradient1}
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
                  <AntDesign name="closecircle" size={16} color="#94A3B8" />
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
                  <Ionicons name="location" size={14} color="#FFFFFF" />
                  <Text style={styles.activeFilterText}>
                    {selectedLocation.name}
                  </Text>
                </View>
              )}
              {rangeSelector && (
                <View style={styles.activeFilterTag}>
                  <MaterialIcons
                    name="attach-money"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.activeFilterText}>
                    Up to ${priceRange[0]}
                  </Text>
                </View>
              )}
              {serviceType && selectedType && (
                <View style={styles.activeFilterTag}>
                  <MaterialIcons
                    name="cleaning-services"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.activeFilterText}>{selectedType}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Jobs Section */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={styles.jobsTitle}>
              {selectedLocation?.name
                ? `Jobs in ${selectedLocation.name}`
                : 'Nearby Cleaning Jobs'}
            </Text>
            {!noLocation && (
              <Text style={styles.jobsCount}>
                {displayedJobs.length} job
                {displayedJobs.length !== 1 ? 's' : ''} available
              </Text>
            )}
          </View>

          {loading2 ? (
            <View style={styles.loadingJobsContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingJobsText}>Loading jobs...</Text>
            </View>
          ) : noLocation ? (
            <View style={styles.noLocationContainer}>
              <MaterialIcons
                name="location-off"
                size={RFPercentage(8)}
                color="#CBD5E1"
              />
              <Text style={styles.noLocationTitle}>Location Required</Text>
              <Text style={styles.noLocationText}>
                {`Please apply a location filter to see nearby\ncleaning jobs`}
              </Text>
            </View>
          ) : displayedJobs.length === 0 ? (
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
                        <AntDesign name="close" size={22} color="#6B7280" />
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
                        maximumTrackTintColor="#E5E7EB"
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.sliderMin}>$10</Text>
                        <Text style={styles.sliderMax}>$2000+</Text>
                      </View>
                    </View>

                    {/* Apply Button */}
                    <View style={styles.modalButtonContainer}>
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={handlePriceRangeApply}
                        disabled={priceLoading}>
                        <LinearGradient
                          colors={[Colors.gradient1, Colors.gradient2]}
                          style={styles.applyButtonGradient}>
                          {priceLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.applyButtonText}>
                                Apply Filter
                              </Text>
                              <AntDesign
                                name="check"
                                size={18}
                                color="#FFFFFF"
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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{flex: 1}}>
              <Animated.View
                style={[
                  styles.serviceModal,
                  {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
                ]}>
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
                    <AntDesign name="close" size={22} color="#6B7280" />
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
                {query2.length > 0 ? (
                  selectedType.length === 0 && (
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
                              }}>
                              <MaterialIcons
                                name="check-circle-outline"
                                size={20}
                                color="#9CA3AF"
                              />
                              <Text style={styles.resultText}>{item}</Text>
                              <AntDesign
                                name="right"
                                size={16}
                                color="#9CA3AF"
                              />
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
                            color="#CBD5E1"
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
                          color="#10B981"
                        />
                        <Text style={styles.tipText}>
                          Search by service type
                        </Text>
                      </View>
                      <View style={styles.tipItem}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.tipText}>
                          Browse available categories
                        </Text>
                      </View>
                      <View style={styles.tipItem}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.tipText}>
                          Select one to apply filter
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Selected Type - Keep this outside so it shows even when no query */}
                {selectedType.length > 0 && (
                  <View style={styles.selectedTypeContainer}>
                    <Text style={styles.selectedTypeLabel}>
                      Selected Service:
                    </Text>
                    <View style={styles.selectedTypeCard}>
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#10B981"
                      />
                      <Text style={styles.selectedTypeText}>
                        {selectedType}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedType('');
                          setQuery2('');
                        }}>
                        <AntDesign name="close" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* Apply Button */}
                <View style={[styles.modalButtonContainer]}>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      query2.length === 0 && styles.buttonDisabled,
                    ]}
                    onPress={handleServiceTypeApply}
                    disabled={query2.length === 0 || loactionLoading}>
                    <LinearGradient
                      colors={[Colors.gradient1, Colors.gradient2]}
                      style={styles.applyButtonGradient}>
                      {loactionLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.applyButtonText}>
                            Apply Filter
                          </Text>
                          <AntDesign name="check" size={18} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
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
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
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
    shadowColor: '#000',
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
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 234, 253, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  removeFilter: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation: 2,
  },
  activeFiltersCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 16,
  },
  activeFiltersTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#4B5563',
    marginBottom: 12,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gradient1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: '#FFFFFF',
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
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    width: '50%',
  },
  jobsCount: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingJobsContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingJobsText: {
    marginTop: 12,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLocationTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: '#F8FAFF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  viewMoreText: {
    fontSize: RFPercentage(1.6),
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: '50%',
    shadowColor: '#3c5c87ff',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  serviceModal: {
    width: width - 40,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: '40%',
    minHeight: '60%',
    shadowColor: '#3c5c87ff',
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
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
  },
  modalCloseButton: {
    padding: 4,
  },
  priceDisplayCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: RFPercentage(3),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 8,
  },
  priceHint: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: '#9CA3AF',
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
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
  },
  sliderMax: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
  },
  searchContainer: {
    // marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    width: '100%',
  },
  resultsContainer: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  noResults: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#9CA3AF',
  },
  selectedTypeContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  selectedTypeLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 12,
  },
  selectedTypeText: {
    flex: 1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#166534',
  },
  modalButtonContainer: {
    marginTop: 8,
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  applyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  applyButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },

  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginVertical: 16,
  },
  emptySearchTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
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
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
  },

  noResultsTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
});

export default CleanerJobs;
