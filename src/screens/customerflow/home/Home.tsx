import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  TouchableWithoutFeedback,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Keyboard,
  Pressable,
} from 'react-native';
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import SearchField from '../../../components/SearchField';
import ServicesCard from '../../../components/ServicesCard';
import {useNavigation} from '@react-navigation/native';
import HeaderBack from '../../../components/HeaderBack';
import Slider from '@react-native-community/slider';
import firestore from '@react-native-firebase/firestore';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GradientButton from '../../../components/GradientButton';
import auth from '@react-native-firebase/auth';
import {useDispatch} from 'react-redux';
import {setProfileData} from '../../../redux/ProfileData/Actions';
import NotFound from '../../../components/NotFound';
import {useExitAppOnBack} from '../../../utils/ExitApp';
import {useSelector} from 'react-redux';
import CustomModal from '../../../components/CustomModal';
import {useCurrentLocation} from '../../../utils/userLocation';
import haversine from 'haversine';
import {clearFilterLocation} from '../../../redux/location/Actions';

const categories = [
  {id: '1', name: 'All', icon: Icons.all},
  {id: '44', name: 'Residential Cleaning', icon: Icons.residential},
  {id: '66', name: 'Car Cleaning', icon: Icons.car},
  {id: '55', name: 'Pressure Washing', icon: Icons.pressure},
  {id: '22', name: 'Chimney Cleaning', icon: Icons.chimney},
  {id: '33', name: 'Carpet Cleaning', icon: Icons.carpet},
  {id: '11', name: 'Window Cleaning', icon: Icons.window},
  {
    id: '77',
    name: 'Lawn Care',
    icon: Icons.lawn,
  },
  {
    id: '88',
    name: 'Others',
    icon: Icons.others,
  },
];

interface Service {
  id: string;
  createdAt?: any;
  name?: string;
  image?: string;
  description?: string;
  availability?: any[];
  type?: any[];
  location?: any;
  serviceImages?: any[];
  packages?: any[];
  rating?: number | null;
  reviews?: any[];
}

const Home = () => {
  useExitAppOnBack();
  const [categorySelection, setCategorySelection] = useState('1');
  const navigation = useNavigation<any>();
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangeSelector, setRangeSelector] = useState(false);
  const [loctionFilter, setLocationFilter] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [nameQuery, setNameQuery] = useState<string>('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initializingLocation, setInitializingLocation] = useState(true);

  const userFlow = useSelector((state: any) => state.userFlow.userFlow); // 👈 get user flow
  const [showAuthModal, setShowAuthModal] = useState(false); // 👈 new modal state
  const {location} = useCurrentLocation();
  const selectedLocation = useSelector(
    (state: any) =>
      state?.location?.filterLocation ?? {
        latitude: null,
        longitude: null,
        name: '',
      },
  );

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
    serviceDetails();
    fetchUserData();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 2000);
  };

  // Fetching Services
  useEffect(() => {
    serviceDetails();
  }, []);

  // Fetching Service Details
  const serviceDetails = async () => {
    setLoading(true);
    try {
      const querySnapshot = await firestore()
        .collection('CleanerServices')
        .orderBy('createdAt', 'desc')
        .get();
      if (!querySnapshot.empty) {
        const servicesArray: Service[] = querySnapshot.docs
          .map(doc => {
            const data = doc.data() as Partial<Service>;
            return {
              id: doc.id,
              ...data,
            };
          })
          .filter(
            (service): service is Service =>
              !!service.createdAt &&
              !!service.name &&
              !!service.description &&
              !!service.availability &&
              !!service.type &&
              !!service.location &&
              Array.isArray(service.serviceImages) &&
              service.serviceImages.length > 0 &&
              Array.isArray(service.packages) &&
              service.packages.length > 0,
          );

        setServicesData(servicesArray);
      } else {
        setServicesData([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Modal Animations
  useEffect(() => {
    if (modalVisible2) {
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
  }, [modalVisible2]);

  // Price Appply
  const handlePriceRangeApply = () => {
    setPriceLoading(true);
    setTimeout(() => {
      setPriceLoading(false);
      setModalVisible2(false);
      setRangeSelector(true);
    }, 1500);
  };

  // Current User
  const dispatch = useDispatch();
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        dispatch(setProfileData(userData));
      }
    } catch (error) {}
  };

  const finalFilteredJobs = servicesData.filter(service => {
    if (rangeSelector) {
      const price = service?.packages?.[0]?.price || 0;
      if (price < 0 || price > priceRange[0]) {
        console.log('❌ Filtered by PRICE');
        return false;
      }
    }

    if (nameQuery.trim() !== '') {
      if (!service.name?.toLowerCase().includes(nameQuery.toLowerCase())) {
        console.log('❌ Filtered by NAME');
        return false;
      }
    }

    if (categorySelection !== '1') {
      if (!service.type?.includes(categorySelection)) {
        console.log('❌ Filtered by CATEGORY');
        return false;
      }
    }

    const activeLocation = selectedLocation?.latitude
      ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : location;

    console.log('📍 Active location:', activeLocation);
    console.log('🏠 Service location:', service.location);

    if (activeLocation && activeLocation.latitude && activeLocation.longitude) {
      console.log('✅ User has location - applying 20km radius filter');

      if (service?.location?.latitude && service?.location?.longitude) {
        const start = {
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
        };
        const end = {
          latitude: service.location.latitude,
          longitude: service.location.longitude,
        };

        const distance = haversine(start, end, {unit: 'km'});
        console.log(`📏 Distance from user to ${service.name}: ${distance}km`);

        if (distance > 20) {
          console.log('❌ Filtered by DISTANCE (>20km)');
          return false; // Outside 20km radius
        }
        console.log('✅ Within 20km radius');
      } else {
        console.log('❌ Service has NO coordinates - HIDING from results');
        return false;
      }
    } else {
    }

    console.log('✅ Service PASSED all filters');
    return true;
  });

  console.log('location,,,,,,,', location);
  console.log('finalFilteredJobs,,,,,,,', finalFilteredJobs);

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderBack
          logo={true}
          title="Home"
          right={true}
          rightText="Post Job"
          textStyle={{fontSize: RFPercentage(2.2)}}
          onPress={() => {
            if (userFlow === 'Guest') {
              setShowAuthModal(true); // 👈 show modal if guest
            } else {
              navigation.navigate('PostJob', {jobId: null}); // 👈 normal flow
            }
          }}
        />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always">
          <View style={styles.container}>
            {/* Search Field */}
            <View style={styles.searchContainer}>
              <SearchField
                placeholder="Search Businesses"
                value={nameQuery}
                onChangeText={setNameQuery}
              />
            </View>

            {/* Categories */}
            <Text style={[styles.sectionTitle, {marginTop: RFPercentage(2)}]}>
              Categories
            </Text>
            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategorySelection(item?.id)}
                  style={{marginTop: RFPercentage(0.5)}}>
                  <View
                    style={[
                      styles.categoryBox,
                      {
                        borderColor:
                          categorySelection === item.id
                            ? Colors.gradient2
                            : Colors.inputFieldColor,
                      },
                    ]}>
                    <Image
                      source={item.icon}
                      resizeMode="contain"
                      style={[
                        styles.categoryIcon,
                        {
                          width:
                            item.id === '1' || item.id === '88'
                              ? RFPercentage(3.2)
                              : RFPercentage(4),
                          height:
                            item.id === '1' || item.id === '88'
                              ? RFPercentage(3.2)
                              : RFPercentage(4),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          fontFamily:
                            categorySelection === item.id
                              ? Fonts.semiBold
                              : Fonts.fontMedium,
                        },
                      ]}>
                      {item.name.length > 8
                        ? `${item.name.slice(0, 8)}..`
                        : item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.flatListPadding}
            />

            {/* Filters */}
            <Text style={styles.sectionTitle}>Apply filters</Text>
            <View style={styles.filterWrapper}>
              {/* Location */}
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
                    style={styles.filterImg}
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

              {/* Price Range */}
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
                      marginLeft: RFPercentage(2),
                    },
                  ]}>
                  <Image
                    source={
                      rangeSelector ? Icons.priceRangeWhite : Icons.priceRange
                    }
                    style={styles.filterImg}
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
            </View>

            {/* Cleaners Services */}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '90%',
                alignSelf: 'center',
                marginTop: RFPercentage(3),
              }}>
              <Text
                style={{
                  color: Colors.primaryText,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.8),
                }}>
                Nearby Services
                {selectedLocation?.name ? ':' : ''}
              </Text>
              <Text
                style={{
                  color: Colors.secondaryText,
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.5),
                  marginLeft: RFPercentage(1),
                }}>
                {selectedLocation && selectedLocation.name
                  ? selectedLocation.name.length > 30
                    ? selectedLocation.name.substring(0, 30) + '...'
                    : selectedLocation.name
                  : ''}
              </Text>
            </View>

            {loading ? (
              <>
                <ActivityIndicator
                  size={'large'}
                  color={Colors.placeholderColor}
                  style={{top: RFPercentage(14)}}
                />
              </>
            ) : (
              <>
                <View style={styles.servicesContainer}>
                  {finalFilteredJobs.length === 0 ? (
                    <>
                      <View style={{bottom: RFPercentage(4)}}>
                        <NotFound text="No service found" />
                      </View>
                    </>
                  ) : (
                    <>
                      <FlatList
                        data={finalFilteredJobs}
                        keyExtractor={item => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={{paddingBottom: RFPercentage(1)}}
                        columnWrapperStyle={styles.serviceColumnWrapper}
                        renderItem={({item}) => (
                          <View style={styles.serviceItem}>
                            <ServicesCard
                              covers={item?.serviceImages}
                              name={item?.name}
                              icon={item?.image}
                              price={item?.packages?.[0]?.price ?? 0}
                              star={IMAGES?.star}
                              rating={5}
                              location={item?.location}
                              onPress={() =>
                                navigation.navigate('ServiceDetails', {
                                  item: item,
                                })
                              }
                            />
                          </View>
                        )}
                      />
                    </>
                  )}
                </View>
              </>
            )}
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
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.close}
                        onPress={() => setModalVisible2(false)}>
                        <AntDesign
                          name="closecircleo"
                          size={RFPercentage(2.6)}
                          color={Colors.secondaryText}
                        />
                      </TouchableOpacity>
                      <View
                        style={[
                          {
                            marginTop: RFPercentage(3),
                          },
                          // styles.modalInner,
                        ]}>
                        <Text
                          style={[
                            styles.applyLocation,
                            {top: RFPercentage(2)},
                          ]}>
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
                          maximumTrackTintColor={Colors.borderBottomColor}
                          thumbTintColor={Colors.gradient1}
                        />
                        <View style={styles.sliderLabelsContainer}>
                          <Text
                            style={[
                              styles.sliderLabel,
                              {left: RFPercentage(1)},
                            ]}>
                            0$
                          </Text>
                          <Text
                            style={[
                              styles.sliderLabel,
                              {left: RFPercentage(1)},
                            ]}>
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
                      {/* Apply Button */}
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

        <Modal
          transparent
          visible={showAuthModal}
          animationType="fade"
          onRequestClose={() => setShowAuthModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowAuthModal(false)}>
            <View style={styles.modalContainer}>
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={5}
                reducedTransparencyFallbackColor="white"
              />
              <CustomModal
                title="Login Required!"
                subTitle="You need to log in or create an account to access this feature."
                onPress={() => setShowAuthModal(false)} // Cancel
                onPress2={() => {
                  setShowAuthModal(false);
                  navigation.navigate('UserSelection'); // or 'Login'
                }}
                buttonTitle="Login"
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    paddingBottom: RFPercentage(12),
  },
  container: {
    backgroundColor: Colors.background,
  },
  headerContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  logo: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  headerText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
  },
  postJobText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
  },
  noServiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: RFPercentage(10),
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
  locationModal: {
    width: '90%',
    height: RFPercentage(52),
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
    // backgroundColor:'red',
    marginTop: RFPercentage(3),
  },
  applyLocation: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
  },
  queryContainer: {
    top: RFPercentage(0.5),
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: RFPercentage(2),
    height: RFPercentage(21),
    paddingVertical: RFPercentage(2),
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
    fontSize: RFPercentage(2),
    color: Colors.primaryText,
  },
  searchContainer: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1.5),
  },
  sectionTitle: {
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
  },
  categoryBox: {
    width: RFPercentage(10),
    height: RFPercentage(10),
    borderRadius: RFPercentage(1),
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(1),
    marginTop: RFPercentage(0.6),

    // Shadow for iOS
    shadowColor: 'rgb(204, 206, 209)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#fff',
    borderBottomWidth: RFPercentage(0.4),
  },

  categoryIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
  },
  categoryText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
    textAlign: 'center',
    top: RFPercentage(0.9),
  },
  flatListPadding: {
    paddingHorizontal: RFPercentage(1.4),
    paddingBottom: RFPercentage(0.2),
  },
  filterBox: {
    width: RFPercentage(15),
    height: RFPercentage(5),
    borderWidth: RFPercentage(0.1),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(100),
    borderColor: Colors.inputFieldColor,
    flexDirection: 'row',
    marginTop: RFPercentage(1),

    backgroundColor: '#fff',
    // Shadow (iOS) + Elevation (Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  filterText: {
    fontSize: RFPercentage(1.6),
  },
  serviceColumnWrapper: {
    // justifyContent: 'space-between',
    // backgroundColor:'red'
  },
  serviceItem: {
    margin: RFPercentage(0.6),
    width: '47.5%',
    marginTop: RFPercentage(1),
  },
  servicesContainer: {
    marginTop: RFPercentage(0.5),
    width: '95%',
    alignSelf: 'center',
  },
  popableStyle: {
    width: RFPercentage(24),
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  popableContent: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: RFPercentage(24),
  },
  popableInnerView: {
    width: '100%',
    alignItems: 'center',
  },
  sliderStyle: {
    width: '100%',
    height: RFPercentage(3),
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    // bottom: 5,
    // marginTop: -4,
  },
  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    marginTop: RFPercentage(1),
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
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
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  filterImg: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    marginRight: RFPercentage(0.5),
  },
  cross: {
    position: 'absolute',
    right: RFPercentage(-0.6),
    top: RFPercentage(0.5),
  },
  close: {
    position: 'absolute',
    right: RFPercentage(2),
    top: RFPercentage(2),
  },
  authModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authModalContent: {
    width: '85%',
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(2),
    paddingVertical: RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
    alignItems: 'center',
  },
  authTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.4),
    color: Colors.primaryText,
  },
  authDesc: {
    marginTop: RFPercentage(1.5),
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.9),
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.8),
  },
  closeModalText: {
    color: Colors.gradient2,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
  },
});
