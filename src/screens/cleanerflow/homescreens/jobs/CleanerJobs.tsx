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
    console.log('user.......', user);
    if (!user) return;
    try {
      const snapshot = await firestore()
        .collection('Jobs')
        .where('status', '==', 'active')
        // .orderBy('createdAt2', 'desc')
        .get();

      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(jobs);
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
    // Convert to string and handle null/undefined
    const textStr = String(text || '');
    if (textStr?.length <= maxChars) return textStr;
    return textStr?.slice(0, maxChars).trim() + '... ';
  };

  const getTruncatedText2 = (text: any) => {
    const maxChars = 30;
    // Convert to string and handle null/undefined
    const textStr = String(text || '');
    if (textStr?.length <= maxChars) return textStr;
    return textStr?.slice(0, maxChars).trim() + '... ';
  };

  useEffect(() => {
    if (modalVisible || modalVisible2 || modalVisible3) {
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
  }, [modalVisible, modalVisible2, modalVisible3]);

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

    // Service type filter - More robust exact matching
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

    // Priority 1: If user has selected a specific location, use that
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
          console.log('Distance calculation error:', error);
          return true; // Show job if distance calculation fails
        }
      } else {
        return false; // Hide jobs without coordinates when location filter is active
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
          return distance <= 20; // Only show jobs within 20km of current location
        } catch (error) {
          console.log('Distance calculation error:', error);
          return true;
        }
      } else {
        return false; // Hide jobs without coordinates when we have current location
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
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.background,
          }}>
          <ActivityIndicator size="large" color={Colors.gradient2} />
          <Text
            style={{
              marginTop: 10,
              color: Colors.secondaryText,
              fontFamily: Fonts.fontMedium,
            }}>
            Fetching your location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title={'Recent Jobs posts by clients'}
        textStyle={{fontSize: RFPercentage(2)}}
        left
      />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.container}>
          {/* Filters Container */}
          <View>
            <Text style={styles.sectionTitle}>Apply Filters</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: RFPercentage(1),
                height: RFPercentage(6),
                paddingHorizontal: RFPercentage(3),
                paddingBottom: RFPercentage(1),
              }}>
              {/* Location Filter */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.navigate('Location', {location: false});
                  }}
                  style={[
                    styles.filterBox,
                    {
                      backgroundColor: selectedLocation?.name
                        ? Colors.gradient2
                        : 'white',
                    },
                  ]}>
                  <Image
                    source={
                      selectedLocation?.name
                        ? Icons.locationWhite
                        : Icons.location
                    }
                    style={styles.locationImg}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        fontFamily: selectedLocation?.name
                          ? Fonts.semiBold
                          : Fonts.fontMedium,
                        color: selectedLocation?.name
                          ? Colors.background
                          : Colors.primaryText,
                      },
                    ]}>
                    Location
                  </Text>
                </TouchableOpacity>
                {selectedLocation?.name && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      dispatch(clearFilterLocation());
                    }}
                    style={styles.cross}>
                    <AntDesign
                      name="closecircle"
                      size={RFPercentage(2)}
                      color={'rgb(206, 211, 219)'}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Price Range Filter */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setModalVisible2(true)}
                  style={[
                    styles.filterBox,
                    {
                      backgroundColor: rangeSelector
                        ? Colors.gradient2
                        : 'white',
                      marginLeft: RFPercentage(1.5),
                    },
                  ]}>
                  <Image
                    source={
                      rangeSelector ? Icons.priceRangeWhite : Icons.priceRange
                    }
                    style={styles.locationImg}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        fontFamily: rangeSelector
                          ? Fonts.semiBold
                          : Fonts.fontMedium,
                        color: rangeSelector
                          ? Colors.background
                          : Colors.primaryText,
                      },
                    ]}>
                    Price Range
                  </Text>
                </TouchableOpacity>
                {rangeSelector && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setRangeSelector(false)}
                    style={styles.cross}>
                    <AntDesign
                      name="closecircle"
                      size={RFPercentage(2)}
                      color={'rgb(206, 211, 219)'}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Service Type Filter */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setQuery2('');
                    setServiceTypeFilter([]);
                    setSelectedType('');
                    setModalVisible3(true);
                  }}
                  style={[
                    styles.filterBox,
                    {
                      backgroundColor: serviceType ? Colors.gradient2 : 'white',
                      marginLeft: RFPercentage(1.5),
                    },
                  ]}>
                  <Image
                    source={serviceType ? Icons.verifyWhite : Icons.verify}
                    style={styles.locationImg}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        fontFamily: serviceType
                          ? Fonts.semiBold
                          : Fonts.fontMedium,
                        color: serviceType
                          ? Colors.background
                          : Colors.primaryText,
                      },
                    ]}>
                    Service Type
                  </Text>
                </TouchableOpacity>
                {serviceType && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setServiceType(false)}
                    style={styles.cross}>
                    <AntDesign
                      name="closecircle"
                      size={RFPercentage(2)}
                      color={'rgb(206, 211, 219)'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
        <View
          style={{
            width: '90%',
            alignSelf: 'center',
            marginTop: RFPercentage(1),
            marginLeft: RFPercentage(0.5),
          }}>
          <Text
            style={{
              color: Colors.primaryText,
              fontFamily: Fonts.fontMedium,
              fontSize: RFPercentage(1.8),
            }}>
            {selectedLocation?.name
              ? `Jobs : ${selectedLocation?.name}`
              : `Nearby Jobs`}
          </Text>
        </View>

        {/* Jobs Container */}
        <View>
          <View style={styles.listContainer}>
            {loading2 ? (
              <ActivityIndicator
                size={RFPercentage(5)}
                color={Colors.placeholderColor}
                style={{marginTop: RFPercentage(30)}}
              />
            ) : noLocation ? (
              <View
                style={{
                  marginTop: RFPercentage(20),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: Colors.primaryText,
                    fontSize: RFPercentage(1.8),
                    fontFamily: Fonts.fontMedium,
                    textAlign: 'center',
                  }}>
                  {`Apply a location for\nbetter experience`}
                </Text>
              </View>
            ) : displayedJobs.length === 0 ? (
              <NotFound text="No Job found" />
            ) : (
              <>
                <FlatList
                  contentContainerStyle={{paddingBottom: RFPercentage(3)}}
                  data={displayedJobs}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({item}) => (
                    <JobCard
                      name={getTruncatedText(item.title)}
                      location={item.location?.name || 'Not added'}
                      price={getTruncatedText2(item.priceRange)}
                      date={item.createdAt}
                      onPress={() =>
                        navigation.navigate('JobDetails', {item: item})
                      }
                      delete={false}
                    />
                  )}
                />
                {sortedJobs?.length > 10 && (
                  <TouchableOpacity
                    onPress={() => setShowAllJobs(prev => !prev)}
                    style={{
                      marginVertical: RFPercentage(2),
                      alignSelf: 'center',
                    }}>
                    <Text
                      style={{
                        color: Colors.gradient1,
                        fontSize: RFPercentage(1.7),
                        fontFamily: Fonts.fontMedium,
                      }}>
                      {showAllJobs ? 'View Less' : 'View More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Price Range Modal */}
      {modalVisible2 && (
        <>
          <TouchableWithoutFeedback onPress={() => setModalVisible2(false)}>
            <View style={styles.modalContainer}>
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={5}
              />
              <Modal
                visible={modalVisible2}
                transparent={true}
                animationType="none"
                onRequestClose={() => setModalVisible2(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={{flex: 1}}>
                  <Animated.View
                    style={[
                      {
                        opacity: opacityAnim,
                        transform: [{scale: scaleAnim}],
                      },
                      styles.rangeModal,
                    ]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Price Range</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.closeButton}
                        onPress={() => setModalVisible2(false)}>
                        <AntDesign
                          name="close"
                          size={RFPercentage(2.2)}
                          color={Colors.secondaryText}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Current Price Display */}
                    <View style={styles.priceDisplayContainer}>
                      <View style={styles.priceBubble}>
                        <Text style={styles.priceValue}>
                          ${tempValue.current}
                        </Text>
                      </View>
                    </View>

                    {/* Slider Container */}
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.sliderStyle}
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
                        maximumTrackTintColor={
                          Platform.OS === 'ios' ? '#bfc9deff' : '#7a7e85ff'
                        }
                      />

                      {/* Slider Labels */}
                      <View style={styles.sliderLabelsContainer}>
                        <Text style={styles.sliderMinLabel}>$10</Text>
                        <Text style={styles.sliderMaxLabel}>$2000+</Text>
                      </View>

                      {/* Range Indicator */}
                      <View style={styles.rangeIndicator}>
                        <View style={styles.rangeIndicatorLine} />
                        <Text style={styles.rangeIndicatorText}>
                          Selected range: $0 - ${tempValue.current}
                        </Text>
                      </View>
                    </View>

                    {/* Apply Button */}
                    <View style={styles.buttonContainer}>
                      <GradientButton
                        title="Apply"
                        onPress={handlePriceRangeApply}
                        loading={priceLoading}
                      />
                    </View>
                  </Animated.View>
                </KeyboardAvoidingView>
              </Modal>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}

      {/* Service Type */}
      {modalVisible3 && (
        <View style={styles.modalContainer}>
          <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
          <Modal
            visible={modalVisible3}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible3(false)}>
            <KeyboardAvoidingView
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
              style={{flex: 1, alignItems: 'center'}}>
              <Animated.View
                style={[
                  styles.locationModal,
                  {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
                ]}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Service Type</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible3(false)}>
                    <AntDesign
                      name="close"
                      size={RFPercentage(2.2)}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                </View>

                {/* Search Section */}
                <View style={styles.searchSection}>
                  <SearchField
                    placeholder="Search service types..."
                    customStyle={styles.searchInput}
                    value={query2}
                    onChangeText={handleSearch2}
                  />
                </View>

                {/* Results List */}
                {query2.length > 0 && selectedType.length === 0 && (
                  <View style={styles.resultsContainer}>
                    {Array.isArray(serviceTypeFilter) &&
                    serviceTypeFilter.length > 0 ? (
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
                            <Text style={styles.resultText}>{item}</Text>
                            <AntDesign
                              name="right"
                              size={RFPercentage(1.8)}
                              color={Colors.secondaryText}
                              style={styles.arrowIcon}
                            />
                          </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => (
                          <View style={styles.separator} />
                        )}
                      />
                    ) : (
                      <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>
                          No services found
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Selected Type Preview */}
                {selectedType.length > 0 && (
                  <View style={styles.selectedPreview}>
                    <Text style={styles.selectedLabel}>Selected:</Text>
                    <View style={styles.selectedType}>
                      <Text style={styles.selectedTypeText}>
                        {selectedType}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedType('');
                          setQuery2('');
                        }}
                        style={styles.clearSelection}>
                        <AntDesign
                          name="closecircle"
                          size={RFPercentage(1.6)}
                          color={Colors.secondaryText}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Apply Button */}
                <View style={styles.buttonContainer}>
                  <GradientButton
                    title="Apply"
                    onPress={handleServiceTypeApply}
                    loading={loactionLoading}
                    disabled={query2.length === 0}
                  />
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CleanerJobs;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(10) : RFPercentage(12),
  },
  container: {
    backgroundColor: Colors.background,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    marginTop: RFPercentage(2.5),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    marginLeft: RFPercentage(3),
  },
  filterWrapper: {
    position: 'relative',
  },

  shadowWrapper: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8, // Android shadow
    borderRadius: RFPercentage(0.8),
  },

  filterBox: {
    width: RFPercentage(15),
    height: RFPercentage(4.7),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(100),
    borderColor: Colors.inputFieldColor,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  filterText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.bold,
  },
  listContainer: {
    marginTop: RFPercentage(0.7),
    width: '100%',
  },
  jobPosted: {
    textAlign: 'center',
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
  },
  jobPostedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
  noServiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: RFPercentage(20),
  },
  noServiceImg: {
    width: RFPercentage(10),
    height: RFPercentage(10),
  },
  noServiceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },

  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
  },

  modalInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(3),
  },
  applyLocation: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.1),
  },
  queryContainer: {
    top: RFPercentage(0.5),
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: RFPercentage(21),
    borderRadius: RFPercentage(1),
  },
  queryText: {
    padding: RFPercentage(2),
    fontSize: RFPercentage(1.6),
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  rangeModal: {
    width: '90%',
    height: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    borderRadius: RFPercentage(2.5),
    top: RFPercentage(20),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(2.5),
    shadowColor: 'rgba(90, 138, 179, 1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth:RFPercentage(0.1),
    borderColor:"rgba(235, 242, 249, 1)"
  },
  range: {
    textAlign: 'center',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    color: Colors.primaryText,
  },
  locationImg: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    marginRight: RFPercentage(0.5),
  },
  cross: {
    position: 'absolute',
    right: RFPercentage(-0.7),
    top: RFPercentage(-0.7),
  },
  close: {
    position: 'absolute',
    right: RFPercentage(2),
    top: RFPercentage(2),
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
  locationModal: {
    width: '85%',
    // height: '60%',
    minHeight: RFPercentage(40),
    alignSelf: 'center',
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(2.5),
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(2),
    // Shadow
    shadowColor: 'rgba(90, 138, 179, 1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: RFPercentage(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(2),
  },
  modalTitle: {
    color: Colors.secondaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    flex: 1,
  },
  closeButton: {
    padding: RFPercentage(0.5),
  },
  searchSection: {
    width: '100%',
    marginBottom: RFPercentage(1),
  },
  searchInput: {
    borderColor: 'rgba(226, 232, 240, 0.8)',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
    marginTop: RFPercentage(1),
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
  },
  resultText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    flex: 1,
  },
  arrowIcon: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    marginHorizontal: RFPercentage(1.5),
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(3),
  },
  noResultsText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
  },
  selectedPreview: {
    width: '100%',
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(1),
  },
  selectedLabel: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    marginBottom: RFPercentage(0.5),
  },
  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    paddingVertical: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
  },
  selectedTypeText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    flex: 1,
  },
  clearSelection: {
    padding: RFPercentage(0.3),
  },
  buttonContainer: {
    width: '100%',
    marginTop: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceDisplayContainer: {
    alignItems: 'center',
    marginBottom: RFPercentage(4),
  },

  priceBubble: {
    backgroundColor: 'rgba(202, 217, 238, 0.44)',
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    alignItems: 'center',
    // Shadow
    shadowColor: 'rgba(130, 170, 193, 0.69)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  priceLabel: {
    color: Colors.background,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    opacity: 0.9,
  },

  priceValue: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.4),
    marginTop: RFPercentage(0.2),
  },

  sliderContainer: {
    width: '100%',
    marginBottom: RFPercentage(4),
  },

  sliderStyle: {
    width: '100%',
    height: RFPercentage(4),
  },

  sliderThumb: {
    shadowColor: Colors.gradient1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: RFPercentage(1),
  },

  sliderMinLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },

  sliderMaxLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },

  rangeIndicator: {
    alignItems: 'center',
    marginTop: RFPercentage(3),
  },

  rangeIndicatorLine: {
    width: '60%',
    height: 1,
    backgroundColor: Colors.inputFieldColor,
    marginBottom: RFPercentage(1),
  },

  rangeIndicatorText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
  },
});
