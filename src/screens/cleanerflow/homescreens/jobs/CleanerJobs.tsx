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

const items = [
  'Residential Cleaning',
  'Car Cleaning',
  'Window Cleaning',
  'Pressure Washing',
  'Carpet Cleaning',
  'Chimney Cleaning',
  'Lawn Care',
];

const CleanerJobs = () => {
  const navigation = useNavigation();
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [rangeSelector, setRangeSelector] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [loctionFilter, setLocationFilter] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [loactionLoading, setLocationLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [serviceType, setServiceType] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [query2, setQuery2] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  useExitAppOnBack();

  // console.log('temp value......................', tempValue.current)

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
        // .orderBy('createdAt2', 'desc')
        .get();

      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobsData(jobs);

      const locationsArray = jobs
        .map(service => service.location)
        .filter(location => location !== undefined);

      const uniqueLocations = Array.from(new Set(locationsArray));
      setLocations(uniqueLocations);
    } catch (error) {
      console.log('Error fetching jobs:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, []),
  );

  const getTruncatedText = text => {
    const maxChars = 12;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const getTruncatedText2 = text => {
    const maxChars = 24;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
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
  }, [modalVisible || modalVisible2 || modalVisible3]);

  const handleLocationApply = () => {
    setLocationLoading(true);
    setTimeout(() => {
      setLocationLoading(false);
      setModalVisible(false);
      setLocationFilter(true);
    }, 1500);
  };

  const handlePriceRangeApply = () => {
    setPriceLoading(true);
    setTimeout(() => {
      setPriceLoading(false);
      setModalVisible2(false);
      setRangeSelector(true);
    }, 1500);
  };

  // Filters
  const [filteredLocations, setFilteredLocations] = useState([]);
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = locations.filter(location =>
        location.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [query, locations]);

  const handleSearch = query => {
    setQuery(query);
    const filtered = locations.filter(location =>
      location.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredLocations(filtered);
  };

  const [serviceTypeFilter, setServiceTypeFilter] = useState([]);
  useEffect(() => {
    if (query2.trim().length > 0) {
      const filtered = items.filter(location =>
        location.toLowerCase().includes(query2.toLowerCase()),
      );
      setServiceTypeFilter(filtered);
    } else {
      setServiceTypeFilter([]);
    }
  }, [query2]);

  const handleSearch2 = query => {
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

  const finalFilteredJobs = jobsData.filter(job => {
    const matchesLocation =
      !loctionFilter ||
      selectedLocation.length === 0 ||
      (job.location &&
        job.location
          .toLowerCase()
          .includes(selectedLocation.trim().toLowerCase()));

    const matchesPrice =
      !rangeSelector ||
      (job.priceRange >= 0 && job.priceRange <= priceRange[0]);

    const matchesServiceType =
      !serviceType ||
      (job.type &&
        job.type.toLowerCase().includes(selectedType.trim().toLowerCase()));

    return matchesLocation && matchesPrice && matchesServiceType;
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  const [showAllJobs, setShowAllJobs] = useState(false);

  const sortedJobs = finalFilteredJobs.sort(
    (a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.(),
  );

  const displayedJobs = showAllJobs ? sortedJobs : sortedJobs.slice(0, 10);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <HeaderBack title={'Jobs'} textStyle={{fontSize: RFPercentage(2.2)}} />
        <View style={styles.container}>
          <View style={styles.jobPostedContainer}>
            <Text style={styles.jobPosted}>Recent Jobs posts by clients</Text>
          </View>

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
                paddingHorizontal:RFPercentage(3)
              }}>
              {/* Location Filter */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setQuery('');
                    setFilteredLocations([]);
                    setSelectedLocation([]);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.filterBox,
                    {
                      backgroundColor: loctionFilter
                        ? Colors.gradient2
                        : 'transparent',
                    },
                  ]}>
                  <Image
                    source={
                      loctionFilter ? Icons.locationWhite : Icons.location
                    }
                    style={styles.locationImg}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        fontFamily: loctionFilter
                          ? Fonts.semiBold
                          : Fonts.fontMedium,
                        color: loctionFilter
                          ? Colors.background
                          : Colors.primaryText,
                      },
                    ]}>
                    Location
                  </Text>
                </TouchableOpacity>
                {loctionFilter && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedLocation([]);
                      setLocationFilter(false);
                      setQuery('');
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
                        : 'transparent',
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
                      backgroundColor: serviceType
                        ? Colors.gradient2
                        : 'transparent',
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

        {/* Jobs Container */}
        <View>
          <View style={styles.listContainer}>
            {loading ? (
              <>
                <ActivityIndicator
                  size={RFPercentage(5)}
                  color={Colors.placeholderColor}
                  style={{marginTop: RFPercentage(30)}}
                />
              </>
            ) : (
              <>
                (
                <>
                  <FlatList
                    contentContainerStyle={{paddingBottom: RFPercentage(3)}}
                    data={displayedJobs}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => (
                      <JobCard
                        name={getTruncatedText(item.title)}
                        location={item.location}
                        price={getTruncatedText2(item.priceRange)}
                        date={item.createdAt}
                        onPress={() =>
                          navigation.navigate('JobDetails', {item: item})
                        }
                        delete={false}
                      />
                    )}
                  />
                  {sortedJobs.length > 10 && (
                    <TouchableOpacity
                      onPress={() => setShowAllJobs(prev => !prev)}
                      style={{marginTop: RFPercentage(2), alignSelf: 'center'}}>
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
                ) : (
                <>
                  {finalFilteredJobs.length === 0 && (
                    <NotFound text="No Job found" />
                  )}
                </>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Filter Modals */}
      {modalVisible && (
        <>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <Modal
              visible={modalVisible}
              transparent={true}
              animationType="none"
              onRequestClose={() => setModalVisible(false)}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                style={{
                  flex: 1,
                  alignItems: 'center',
                }}>
                <Animated.View
                  style={[
                    styles.locationModal,
                    {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
                  ]}>
                  <TouchableOpacity
                    style={styles.close}
                    onPress={() => setModalVisible(false)}>
                    <AntDesign
                      name="closecircleo"
                      size={RFPercentage(2.5)}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                  <View style={styles.modalInner}>
                    <Text style={styles.applyLocation}>
                      Apply Location Via City
                    </Text>
                  </View>
                  <View style={{width: '100%', marginTop: RFPercentage(2)}}>
                    <SearchField
                      placeholder="Search City"
                      customStyle={{borderColor: 'rgba(39, 38, 38, 0.29)'}}
                      value={query}
                      onChangeText={handleSearch}
                    />
                  </View>
                  {query.length > 0 && selectedLocation.length === 0 && (
                    <View style={styles.queryContainer}>
                      {filteredLocations.length === 0 ? (
                        <>
                          <Text style={styles.queryText}>
                            No Location exist
                          </Text>
                        </>
                      ) : (
                        <>
                          <FlatList
                            data={filteredLocations}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({item}) => (
                              <TouchableOpacity
                                onPress={() => {
                                  setQuery(item);
                                  setSelectedLocation(item);
                                }}>
                                <Text style={styles.queryText}>{item}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </>
                      )}
                    </View>
                  )}
                  <View style={{position: 'absolute', bottom: RFPercentage(3)}}>
                    <GradientButton
                      title="Apply"
                      onPress={handleLocationApply}
                      loading={loactionLoading}
                      disabled={
                        query.length > 0 && filteredLocations.length != 0
                          ? false
                          : true
                      }
                    />
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        </>
      )}

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
                    <TouchableOpacity
                      style={styles.close}
                      onPress={() => setModalVisible2(false)}>
                      <AntDesign
                        name="closecircleo"
                        size={RFPercentage(2.5)}
                        color={Colors.secondaryText}
                      />
                    </TouchableOpacity>
                    <View
                      style={[
                        {
                          marginTop: RFPercentage(1),
                        },
                        // styles.modalInner,
                      ]}>
                      <Text
                        style={[styles.applyLocation, {top: RFPercentage(2)}]}>
                        Select Price Range
                      </Text>
                    </View>
                    <View style={{width: '100%', marginTop: RFPercentage(8)}}>
                      {/* Slider */}
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
                        maximumTrackTintColor="gray"
                        thumbTintColor={Colors.gradient1}
                      />
                      <View style={styles.sliderLabelsContainer}>
                        <Text
                          style={[styles.sliderLabel, {left: RFPercentage(1)}]}>
                          0$
                        </Text>
                        <Text
                          style={[styles.sliderLabel, {left: RFPercentage(1)}]}>
                          1000$
                        </Text>
                        <Text style={styles.sliderLabel}>2000$+</Text>
                      </View>
                      <View style={{marginTop: RFPercentage(6)}}>
                        {tempValue.current > 10 && (
                          <Text style={styles.range}>
                            Selected Price Range: 0 - {tempValue.current}$
                          </Text>
                        )}
                      </View>
                    </View>
                    <View
                      style={{position: 'absolute', bottom: RFPercentage(4)}}>
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
            animationType="none"
            onRequestClose={() => setModalVisible3(false)}>
            <KeyboardAvoidingView
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
              style={{flex: 1, alignItems: 'center'}}>
              <Animated.View
                style={[
                  styles.locationModal,
                  {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
                ]}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={() => setModalVisible3(false)}>
                  <AntDesign
                    name="closecircleo"
                    size={RFPercentage(2.5)}
                    color={Colors.secondaryText}
                  />
                </TouchableOpacity>
                <View style={styles.modalInner}>
                  <Text style={styles.applyLocation}>Apply Service Type</Text>
                </View>
                <View style={{width: '100%', marginTop: RFPercentage(2)}}>
                  <SearchField
                    placeholder="Search Services"
                    customStyle={{borderColor: 'rgba(39, 38, 38, 0.29)'}}
                    value={query2}
                    onChangeText={handleSearch2}
                  />
                </View>
                {query2.length > 0 && selectedType.length === 0 && (
                  <View style={styles.queryContainer}>
                    {Array.isArray(serviceTypeFilter) &&
                      serviceTypeFilter.length > 0 && (
                        <FlatList
                          data={serviceTypeFilter}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({item}) => (
                            <TouchableOpacity
                              onPress={() => {
                                setQuery2(item);
                                setSelectedType(item);
                              }}>
                              <Text style={styles.queryText}>{item}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      )}
                  </View>
                )}
                <View style={{position: 'absolute', bottom: RFPercentage(3)}}>
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
    paddingBottom: RFPercentage(10),
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
    marginLeft:RFPercentage(3)
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
    backgroundColor: 'white', // Or transparent if not selected
    borderBottomWidth:RFPercentage(0.3)
  },

  filterText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
    fontFamily:Fonts.bold
  },
  listContainer: {
    marginTop: RFPercentage(0.7),
    width: '100%',
  },
  jobPosted: {
    textAlign: 'center',
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
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
  sliderStyle: {
    width: '100%',
    height: RFPercentage(3),
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
  },
  locationModal: {
    width: '90%',
    height: RFPercentage(50),
    alignSelf: 'center',
    backgroundColor: 'rgba(226, 238, 255, 0.9)',
    alignItems: 'center',
    borderRadius: RFPercentage(2.5),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(2.5),
    top: RFPercentage(20),
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
    height: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(226, 238, 255, 0.9)',
    alignItems: 'center',
    borderRadius: RFPercentage(2.5),
    top: RFPercentage(20),
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(2.5),
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
});
