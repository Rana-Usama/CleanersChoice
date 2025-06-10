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
} from 'react-native';
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import SearchField from '../../../components/SearchField';
import ServicesCard from '../../../components/ServicesCard';
import {useNavigation} from '@react-navigation/native';
import HeaderBack from '../../../components/HeaderBack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
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

const categories = [
  {id: '1', name: 'All', icon: Icons.all},
  {id: '44', name: 'Residential', icon: Icons.residential},
  {id: '66', name: 'Car Clean..', icon: Icons.car},
  {id: '55', name: 'Pressure W..', icon: Icons.pressure},
  {id: '22', name: 'Chimney C..', icon: Icons.chimney},
  {id: '33', name: 'Carpet Cle..', icon: Icons.carpet},
  {id: '11', name: 'Window Cl..', icon: Icons.window},
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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rangeSelector, setRangeSelector] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loctionFilter, setLocationFilter] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [nameQuery, setNameQuery] = useState<string>('');
  const [loactionLoading, setLocationLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
              Array.isArray(service.packages),
            // && service.rating !== undefined
            // && Array.isArray(service.reviews)
          );
        setServicesData(servicesArray);

        const locationsArray = servicesArray
          .map(service => service.location)
          .filter(location => location !== undefined);

        const uniqueLocations = Array.from(new Set(locationsArray));
        setLocations(uniqueLocations);
      } else {
        setServicesData([]);
        setLocations([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Location Search
  const handleSearch = (query: any) => {
    setQuery(query);
    const filtered = locations.filter(location =>
      location?.toLowerCase()?.includes(query?.toLowerCase()),
    );
    setFilteredLocations(filtered);
  };

  // Modal Animations
  useEffect(() => {
    if (modalVisible || modalVisible2) {
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
  }, [modalVisible || modalVisible2]);

  // Location Apply
  const handleLocationApply = () => {
    setLocationLoading(true);
    setTimeout(() => {
      setLocationLoading(false);
      setModalVisible(false);
      setLocationFilter(true);
    }, 1500);
  };

  // Price Appply
  const handlePriceRangeApply = () => {
    setPriceLoading(true);
    setTimeout(() => {
      setPriceLoading(false);
      setModalVisible2(false);
      setRangeSelector(true);
    }, 1500);
  };

  // Location Trim
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

  // Filtered Jobs
  const finalFilteredJobs = servicesData.filter(service => {
    if (rangeSelector) {
      const price = service?.packages?.[0]?.price || 0;
      if (price < 0 || price > priceRange[0]) return false;
    }

    if (loctionFilter && selectedLocation.trim() !== '') {
      if (
        !service.location
          ?.toLowerCase()
          .includes(selectedLocation.trim().toLowerCase())
      ) {
        return false;
      }
    }

    if (nameQuery.trim() !== '') {
      if (!service.name?.toLowerCase().includes(nameQuery.toLowerCase())) {
        return false;
      }
    }

    if (categorySelection !== '1') {
      if (!service.type?.includes(categorySelection)) {
        return false;
      }
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <HeaderBack
            logo={true}
            title="Home"
            right={true}
            rightText="Post Job"
            textStyle={{fontSize: RFPercentage(2)}}
            onPress={() => navigation.navigate('PostJob', {jobId: null})}
          />

          {/* Search Field */}
          <View style={styles.searchContainer}>
            <SearchField
              placeholder="Search Businesses"
              value={nameQuery}
              onChangeText={setNameQuery}
            />
          </View>

          {/* Categories */}
          <Text style={[styles.sectionTitle, {}]}>Categories</Text>
          <FlatList
            data={categories}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity
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
                            : Fonts.fontRegular,
                      },
                    ]}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListPadding}
          />

          {/* Filters */}
          <Text style={styles.sectionTitle}>Apply Filter</Text>
          <View style={styles.filterWrapper}>
            {/* Location */}
            <View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
                style={[
                  styles.filterBox,
                  {
                    backgroundColor: loctionFilter
                      ? Colors.gradient2
                      : 'transparent',
                  },
                ]}>
                <Image
                  source={loctionFilter ? Icons.locationWhite : Icons.location}
                  style={styles.filterImg}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      fontFamily: loctionFilter
                        ? Fonts.semiBold
                        : Fonts.fontRegular,
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
                    setSelectedLocation('');
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
                      : 'transparent',
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
                        : Fonts.fontRegular,
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
          <Text style={styles.sectionTitle}>Cleaning Services</Text>
          {loading ? (
            <>
              <ActivityIndicator
                size={'large'}
                color={Colors.placeholderColor}
                style={{top: RFPercentage(15)}}
              />
            </>
          ) : (
            <>
              <View style={styles.servicesContainer}>
                {(rangeSelector ||
                  loctionFilter ||
                  nameQuery ||
                  categorySelection !== '1') &&
                finalFilteredJobs.length === 0 || servicesData.length === 0 ? (
                  <>
                    <NotFound text="No service found" />
                  </>
                ) : (
                  <>
                    <FlatList
                      data={
                        rangeSelector ||
                        loctionFilter ||
                        nameQuery ||
                        categorySelection !== '1'
                          ? finalFilteredJobs
                          : servicesData
                      }
                      keyExtractor={item => item.id.toString()}
                      numColumns={2}
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
                      size={RFPercentage(2.6)}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                  <View style={styles.modalInner}>
                    <Text style={styles.applyLocation}>
                      Apply Location Via City
                    </Text>
                  </View>
                  <View style={{width: '100%', marginTop: RFPercentage(2)}}>
                    {/* Search */}
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
                  {/* Apply Button */}
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
    </SafeAreaView>
  );
};

export default Home;

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
    // backgroundColor:'red',
    marginTop: RFPercentage(3),
  },
  applyLocation: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.2),
  },
  queryContainer: {
    top: RFPercentage(0.5),
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: RFPercentage(2),
    height: RFPercentage(21),
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
    width: RFPercentage(9.5),
    height: RFPercentage(9.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(1),
    marginTop: RFPercentage(0.6),
  },
  categoryIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
  },
  categoryText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.3),
    textAlign: 'center',
    top: RFPercentage(0.9),
  },
  flatListPadding: {
    paddingHorizontal: RFPercentage(1.4),
  },
  filterBox: {
    width: RFPercentage(14),
    height: RFPercentage(4.3),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(0.8),
    borderColor: Colors.inputFieldColor,
    flexDirection: 'row',
    marginTop: RFPercentage(1),
  },

  filterText: {
    fontSize: RFPercentage(1.5),
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
    fontSize: RFPercentage(1.7),
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
    top: RFPercentage(-0.3),
  },
  close: {
    position: 'absolute',
    right: RFPercentage(2),
    top: RFPercentage(2),
  },
});
