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
  StatusBar,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeCard from '../../../components/CardHome';
import Entypo from 'react-native-vector-icons/Entypo';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

const categories = [
  {id: '1', name: 'All', icon: 'apps'},
  {id: '44', name: 'Residential', icon: 'home'},
  {id: '66', name: 'Vehicle', icon: 'car'},
  {id: '55', name: 'Pressure', icon: 'speedometer'},
  {id: '22', name: 'Chimney', icon: 'fireplace'},
  {id: '33', name: 'Carpet', icon: 'texture'},
  {id: '11', name: 'Window', icon: 'view-day'},
  {id: '77', name: 'Lawn Care', icon: 'nature-people'},
  {id: '88', name: 'Others', icon: 'dots-horizontal'},
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
  const [modalVisible2, setModalVisible2] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [nameQuery, setNameQuery] = useState<string>('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initializingLocation, setInitializingLocation] = useState(true);
  const [user, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>(
    null,
  );
  const userFlow = useSelector((state: any) => state.userFlow.userFlow);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {location} = useCurrentLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminViewAllServices, setAdminViewAllServices] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

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
    }, 5000); // fallback after 5 seconds

    if (location && location.latitude && location.longitude) {
      clearTimeout(timer);
      setInitializingLocation(false);
    }
    return () => clearTimeout(timer);
  }, [location]);

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
    if (userFlow === 'Guest') {
      return;
    } else {
      const user = auth().currentUser;
      if (!user) return;
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data() ?? null;
          setUser(userData);
          setIsAdmin(userData?.admin);
          dispatch(setProfileData(userData));
        }
      } catch (error) {}
    }
  };

  const finalFilteredJobs = servicesData.filter(service => {
    // Price filter
    if (rangeSelector) {
      const price = service?.packages?.[0]?.price || 0;
      if (price < 0 || price > priceRange[0]) {
        return false;
      }
    }

    // Name search filter
    if (nameQuery.trim() !== '') {
      if (!service.name?.toLowerCase().includes(nameQuery.toLowerCase())) {
        return false;
      }
    }

    // Category filter
    if (categorySelection !== '1') {
      if (!service.type?.includes(categorySelection)) {
        return false;
      }
    }

    // ADMIN LOGIC: If admin and toggle is ON, skip location filtering
    if (isAdmin && adminViewAllServices) {
      return true;
    }
    if (!service?.location?.latitude || !service?.location?.longitude) {
      return false;
    }
    const activeLocation = selectedLocation?.latitude
      ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : location;
    if (!activeLocation?.latitude || !activeLocation?.longitude) {
      return false;
    }
    const start = {
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
    };
    const end = {
      latitude: service.location.latitude,
      longitude: service.location.longitude,
    };

    const distance = haversine(start, end, {unit: 'km'});
    return distance <= 20;
  });

  const adminViewingAllServices = isAdmin && adminViewAllServices;
  const noLocationForRegularUser =
    !isAdmin && !selectedLocation?.latitude && !location?.latitude;

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
              fontSize: RFPercentage(1.7),
            }}>
            Fetching Your Current Location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const truncateText = (text: string, length = 20) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <>
        <StatusBar
          backgroundColor={Colors.gradient1}
          barStyle="light-content"
          translucent={true}
        />

        <LinearGradient
          colors={[Colors.gradient1, Colors.gradient2]}
          style={styles.gradientHeader}>
          <HeaderBack
            title="Home"
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
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always">
          <View style={styles.safeArea}>
            <View style={styles.container}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '90%',
                  alignSelf: 'center',
                  marginTop: RFPercentage(1.5),
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image
                    source={Icons.location}
                    resizeMode="contain"
                    style={{
                      width: RFPercentage(2.3),
                      height: RFPercentage(2.3),
                    }}
                  />
                  <View style={{marginLeft: RFPercentage(1)}}>
                    <Text
                      style={{
                        fontFamily: Fonts.fontMedium,
                        fontSize: RFPercentage(1.6),
                        color: Colors.secondaryText,
                      }}>
                      Location
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        navigation.navigate('Location', {location: false});
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: RFPercentage(0.5),
                      }}>
                      <Text
                        style={{
                          fontFamily: Fonts.semiBold,
                          fontSize: RFPercentage(1.7),
                          color: Colors.secondaryText,
                        }}>
                        {selectedLocation?.name
                          ? truncateText(selectedLocation.name)
                          : truncateText(location?.address || 'Not Specified')}
                      </Text>
                      <Entypo
                        name="chevron-down"
                        size={RFPercentage(2)}
                        style={{marginLeft: RFPercentage(0.5)}}
                        color={Colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  style={{
                    width: RFPercentage(7),
                    height: RFPercentage(7),
                    borderRadius: RFPercentage(100),
                    borderWidth: 1,
                    borderColor: Colors.gradient2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    source={
                      user?.profile ? {uri: user?.profile} : IMAGES.defaultPic
                    }
                    resizeMode="cover"
                    style={{
                      width: RFPercentage(6.5),
                      height: RFPercentage(6.5),
                      borderRadius: RFPercentage(100),
                    }}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <SearchField
                  placeholder="Search by name..."
                  value={nameQuery}
                  onChangeText={setNameQuery}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setModalVisible2(true)}
                  style={{
                    width: RFPercentage(5.5),
                    height: RFPercentage(5.5),
                    borderRadius: RFPercentage(1.2),
                    borderWidth: RFPercentage(0.1),
                    borderColor: Colors.inputFieldColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: rangeSelector ? Colors.gradient1 : Colors.white,
                  }}>
                  <MaterialIcons
                    name="filter-list-alt"
                    size={RFPercentage(2.8)}
                    color={rangeSelector ? Colors.white : Colors.coolGrayIcon}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.sectionTitle, {marginTop: RFPercentage(1.5)}]}>
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
                          backgroundColor:
                            categorySelection === item.id
                              ? Colors.gradient1
                              : Colors.white,
                        },
                      ]}>
                      <Icon
                        name={item.icon}
                        size={25}
                        color={
                          categorySelection === item.id
                            ? Colors.white
                            : Colors.coolGrayIcon
                        }
                      />
                    </View>
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
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.flatListPadding}
              />
              <HomeCard
                onPostJob={() => {
                  if (userFlow === 'Guest') {
                    setShowAuthModal(true);
                  } else {
                    navigation.navigate('PostJob', {jobId: null});
                  }
                }}
              />

              {/* Admin Toggle - Only visible to admins */}
              {isAdmin && (
                <View style={styles.adminToggleSection}>
                  <View style={styles.adminToggleCard}>
                    <View style={styles.adminToggleHeader}>
                      <View style={styles.adminBadge}>
                        <MaterialIcons
                          name="admin-panel-settings"
                          size={16}
                          color={Colors.white}
                        />
                        <Text style={styles.adminBadgeText}>Admin View</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setAdminViewAllServices(prev => !prev)}
                        style={[
                          styles.adminToggleSwitch,
                          adminViewAllServices &&
                            styles.adminToggleSwitchActive,
                        ]}>
                        <View
                          style={[
                            styles.adminToggleThumb,
                            adminViewAllServices &&
                              styles.adminToggleThumbActive,
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.adminToggleInfo}>
                      <MaterialIcons
                        name={adminViewAllServices ? 'public' : 'location-on'}
                        size={20}
                        color={Colors.gray600}
                      />
                      <View style={styles.adminToggleTextContainer}>
                        <Text style={styles.adminToggleTitle}>
                          {adminViewAllServices
                            ? 'Viewing All Services'
                            : 'Location-Based View'}
                        </Text>
                        <Text style={styles.adminToggleDescription}>
                          {adminViewAllServices
                            ? 'Showing all services'
                            : 'Showing services within 20km radius'}
                        </Text>
                      </View>
                    </View>

                    {adminViewAllServices && (
                      <View style={styles.adminStats}>
                        <Text style={styles.adminStatText}>
                          Total Services: {servicesData.length}
                        </Text>
                        <Text style={styles.adminStatSubText}>
                          Displaying: {finalFilteredJobs.length} services
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '90%',
                  alignSelf: 'center',
                  marginTop: RFPercentage(4),
                }}>
                <Text
                  style={{
                    color: Colors.primaryText,
                    fontFamily: Fonts.fontMedium,
                    fontSize: RFPercentage(1.9),
                  }}>
                  {adminViewingAllServices
                    ? 'All Services'
                    : noLocationForRegularUser
                    ? 'Services'
                    : 'Nearby Services'}
                  {!adminViewingAllServices && selectedLocation?.name
                    ? ':'
                    : ''}
                </Text>
                {!adminViewingAllServices && selectedLocation?.name && (
                  <Text
                    style={{
                      color: Colors.secondaryText,
                      fontFamily: Fonts.fontRegular,
                      fontSize: RFPercentage(1.6),
                      marginLeft: RFPercentage(1),
                    }}>
                    {selectedLocation.name.length > 30
                      ? selectedLocation.name.substring(0, 30) + '...'
                      : selectedLocation.name}
                  </Text>
                )}
                {noLocationForRegularUser && !adminViewingAllServices && (
                  <Text
                    style={{
                      color: Colors.red500,
                      fontFamily: Fonts.fontMedium,
                      fontSize: RFPercentage(1.4),
                      marginLeft: RFPercentage(1),
                      backgroundColor: Colors.redBg50,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}>
                    Location Required
                  </Text>
                )}
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
                    {finalFilteredJobs?.length === 0 ? (
                      <>
                        <View style={{bottom: RFPercentage(4)}}>
                          <NotFound text="No services found" />
                        </View>
                      </>
                    ) : (
                      <>
                        <FlatList
                          data={finalFilteredJobs}
                          keyExtractor={item => item.id.toString()}
                          contentContainerStyle={{
                            paddingBottom: RFPercentage(1),
                          }}
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
                                createdAt={item.createdAt}
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
          </View>
        </ScrollView>

        {modalVisible2 && (
          <>
            <TouchableWithoutFeedback onPress={() => setModalVisible2(false)}>
              <View style={styles.modalContainer}>
                <BlurView
                  style={styles.blurView}
                  blurType="light"
                  blurAmount={10}
                  reducedTransparencyFallbackColor="white"
                />
                <Modal
                  visible={modalVisible2}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setModalVisible2(false)}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{flex: 1}}>
                    <TouchableWithoutFeedback
                      onPress={() => setModalVisible2(false)}>
                      <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                          <Animated.View
                            style={[
                              {
                                opacity: opacityAnim,
                                transform: [{scale: scaleAnim}],
                              },
                              styles.rangeModal,
                            ]}>
                            {/* Header with gradient */}
                            <LinearGradient
                              colors={[Colors.gradient1, Colors.gradient2]}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 0}}
                              style={styles.modalHeader}>
                              <View style={styles.headerContent}>
                                <View style={styles.titleContainer}>
                                  <MaterialIcons
                                    name="price-change"
                                    size={RFPercentage(2.5)}
                                    color={Colors.white}
                                  />
                                  <Text style={styles.modalTitle}>
                                    Price Range
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  style={styles.closeButton}
                                  onPress={() => setModalVisible2(false)}>
                                  <AntDesign
                                    name="close"
                                    size={RFPercentage(2.2)}
                                    color={Colors.white}
                                  />
                                </TouchableOpacity>
                              </View>
                            </LinearGradient>

                            {/* Body */}
                            <View style={styles.modalBody}>
                              {/* Current Price Display */}
                              <View style={styles.priceDisplayCard}>
                                <View style={styles.priceDisplayHeader}>
                                  <Text style={styles.priceDisplayTitle}>
                                    Selected Price
                                  </Text>
                                  <View style={styles.pricePill}>
                                    <Text style={styles.pricePillText}>
                                      ${tempValue.current}
                                    </Text>
                                  </View>
                                </View>

                                {/* Range Display */}
                                <View style={styles.rangeDisplay}>
                                  <View style={styles.rangeItem}>
                                    <Text style={styles.rangeLabel}>Min</Text>
                                    <Text style={styles.rangeValue}>$10</Text>
                                  </View>
                                  <View style={styles.rangeSeparator}>
                                    <View style={styles.dashLine} />
                                  </View>
                                  <View style={styles.rangeItem}>
                                    <Text style={styles.rangeLabel}>Max</Text>
                                    <Text style={styles.rangeValue}>
                                      ${tempValue.current}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Slider Container */}
                              <View style={styles.sliderCard}>
                                <Text style={styles.sliderTitle}>
                                  Adjust Maximum Price
                                </Text>

                                {/* Slider Component */}
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
                                  maximumTrackTintColor={Colors.sliderTrackGray}
                                />

                                {/* Price Markers */}
                                <View style={styles.priceMarkers}>
                                  <Text style={styles.markerText}>$10</Text>
                                  <Text style={styles.markerText}>$1000</Text>
                                  <Text style={styles.markerText}>$2000+</Text>
                                </View>
                              </View>

                              {/* Action Buttons */}
                              <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                  style={styles.removeButton}
                                  onPress={() => {
                                    setPriceRange([10, 2000]);
                                    tempValue.current = 2000;
                                    setModalVisible2(false);
                                    setRangeSelector(false);
                                  }}
                                  activeOpacity={0.8}>
                                  <MaterialIcons
                                    name="filter-alt-off"
                                    size={RFPercentage(2)}
                                    color={Colors.error}
                                  />
                                  <Text style={styles.removeButtonText}>
                                    Remove Filter
                                  </Text>
                                </TouchableOpacity>

                                <View style={styles.applyButtonWrapper}>
                                  <GradientButton
                                    title="Apply Range"
                                    onPress={handlePriceRangeApply}
                                    loading={priceLoading}
                                    style={styles.applyButton}
                                  />
                                </View>
                              </View>
                            </View>
                          </Animated.View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
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
      </>
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
    backgroundColor: Colors.background,
  },
  container: {
    backgroundColor: Colors.background,
  },

  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 25,
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
  bellButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
    width: RFPercentage(5),
    height: RFPercentage(5),
    alignItems: 'center',
    justifyContent: 'center',
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

  postJobText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
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
    fontSize: RFPercentage(1.9),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
  locationModal: {
    width: '90%',
    height: RFPercentage(52),
    alignSelf: 'center',
    backgroundColor: Colors.blueOverlayBg90,
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
    fontSize: RFPercentage(2.1),
  },
  queryContainer: {
    top: RFPercentage(0.5),
    width: '100%',
    backgroundColor: Colors.whiteOverlay30,
    borderRadius: RFPercentage(2),
    height: RFPercentage(21),
    paddingVertical: RFPercentage(2),
  },
  queryText: {
    padding: RFPercentage(2),
    fontSize: RFPercentage(1.7),
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },

  range: {
    textAlign: 'center',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
  },
  searchContainer: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1.5),
    flexDirection: 'row',
    // backgroundColor:"red"
  },
  sectionTitle: {
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
  },
  categoryBox: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(1),
    marginTop: RFPercentage(1),

    // Shadow for iOS
    shadowColor: Colors.shadowBlueGray,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // elevation: 5,
    borderColor: Colors.blueBorderLight,
  },

  categoryIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  categoryText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
    top: RFPercentage(0.9),
  },
  flatListPadding: {
    paddingHorizontal: RFPercentage(1.4),
    paddingBottom: RFPercentage(1.5),
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
    marginTop: RFPercentage(1.5),

    backgroundColor: Colors.white,
    // Shadow (iOS) + Elevation (Android)
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  filterText: {
    fontSize: RFPercentage(1.7),
  },
  serviceColumnWrapper: {
    // justifyContent: 'space-between',
    // backgroundColor:'red'
  },
  serviceItem: {
    margin: RFPercentage(0.6),
    // width: '47.5%',
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

  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(2.0),
    fontFamily: Fonts.semiBold,
    marginTop: RFPercentage(1),
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
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
    backgroundColor: Colors.blackOverlay50,
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
    fontSize: RFPercentage(2.5),
    color: Colors.primaryText,
  },
  authDesc: {
    marginTop: RFPercentage(1.5),
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(2.0),
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.8),
  },
  closeModalText: {
    color: Colors.gradient2,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.1),
  },

  priceDisplayContainer: {
    alignItems: 'center',
    marginBottom: RFPercentage(4),
  },

  priceBubble: {
    backgroundColor: Colors.blueGrayOverlay44,
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    alignItems: 'center',
    // Shadow
    shadowColor: Colors.blueGrayShadow69,
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
    fontSize: RFPercentage(1.5),
    opacity: 0.9,
  },

  priceValue: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.5),
    marginTop: RFPercentage(0.2),
  },

  sliderContainer: {
    width: '100%',
    marginBottom: RFPercentage(4),
  },

  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: RFPercentage(1),
  },

  sliderMinLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },

  sliderMaxLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
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
    fontSize: RFPercentage(1.7),
    textAlign: 'center',
  },

  applyButtonContainer: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackOverlay40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RFPercentage(2),
  },
  rangeModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    height: '65%',
  },
  modalHeader: {
    paddingVertical: RFPercentage(2.5),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
  },
  modalTitle: {
    fontSize: RFPercentage(2.3),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  closeButton: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    backgroundColor: Colors.whiteOverlay20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: RFPercentage(2),
  },
  priceDisplayCard: {
    backgroundColor: Colors.ghostWhite,
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  priceDisplayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
  },
  priceDisplayTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  pricePill: {
    backgroundColor: Colors.gradient1,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 20,
  },
  pricePillText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.5),
  },
  rangeValue: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.primaryText,
  },
  rangeSeparator: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1),
  },
  dashLine: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.toggleGray,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  sliderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  sliderTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(2),
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.sliderTrackGray,
    borderRadius: 3,
    marginBottom: RFPercentage(4),
    position: 'relative',
  },
  sliderProgress: {
    height: 6,
    backgroundColor: Colors.gradient1,
    borderRadius: 3,
  },
  sliderThumbContainer: {
    position: 'absolute',
    top: -RFPercentage(2),
    alignItems: 'center',
  },
  sliderThumb: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.gradient1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbInner: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gradient1,
  },
  thumbValueBubble: {
    position: 'absolute',
    top: -RFPercentage(3.5),
    backgroundColor: Colors.gradient1,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 12,
  },
  thumbValueText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.semiBold,
  },
  sliderStyle: {
    width: '100%',
    height: 40,
  },
  priceMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1),
  },
  markerText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  quickSelectContainer: {
    marginBottom: RFPercentage(2),
  },
  quickSelectTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(1.5),
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFPercentage(1),
  },
  quickButton: {
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 20,
    backgroundColor: Colors.neutralGray,
    borderWidth: 1,
    borderColor: Colors.toggleGray,
  },
  quickButtonActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  quickButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.secondaryText,
  },
  quickButtonTextActive: {
    color: Colors.white,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: RFPercentage(1),
    marginTop: RFPercentage(3),
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.5),
    borderRadius: 100,
    backgroundColor: Colors.lightRoseBg,
    borderWidth: 1,
    borderColor: Colors.lightRoseBorder,
    gap: RFPercentage(1),
    width: RFPercentage(18),
  },
  removeButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.error,
  },
  applyButtonWrapper: {},
  adminToggleSection: {
    marginTop: RFPercentage(2),
    paddingHorizontal: '5%',
  },
  adminToggleCard: {
    backgroundColor: Colors.adminCardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.purple100,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  adminToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.white,
  },
  adminToggleSwitch: {
    width: 50,
    height: 24,
    borderRadius: 13,
    backgroundColor: Colors.gray200,
    padding: 2,
    justifyContent: 'center',
  },
  adminToggleSwitchActive: {
    backgroundColor: Colors.success,
  },
  adminToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  adminToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  adminToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminToggleTextContainer: {
    flex: 1,
  },
  adminToggleTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray800,
    marginBottom: 2,
  },
  adminToggleDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  adminStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  adminStatText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.success,
    marginBottom: 4,
  },
  adminStatSubText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  applyButton: {
    width: RFPercentage(18),

    // height: '100%',
  },
});
