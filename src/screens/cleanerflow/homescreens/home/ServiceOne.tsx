import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Platform,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import DescriptionField from '../../../../components/DescriptionField';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import {useFocusEffect} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import InputField from '../../../../components/InputField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch, useSelector} from 'react-redux';
import {cleanerDescription} from '../../../../redux/Form/Actions';
import MultiSelect from 'react-native-multiple-select';
import {showToast} from '../../../../utils/ToastMessage';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import {tuple} from 'yup';
import { setFilterLocation, setUserLocation } from '../../../../redux/location/Actions';

const {width} = Dimensions.get('window');

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

const ServiceOne: React.FC = ({navigation}: any) => {
  const available = useSelector(
    (state: any) => state?.availablity?.availability,
  );
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const description = useSelector((state: any) => state?.form?.description);
  const [serviceData, setServiceData] = useState(null);
  const profileCompletion = useSelector(
    (state: any) => state?.profile?.profileCompletion,
  );
  const userLocation = useSelector((state: any) => state?.location?.location);
  const profileData = useSelector((state: any) => state?.profile?.profileData);

  const [selectedItems, setSelectedItems] = useState([]);
  const multiSelectRef = useRef(null);
  const [hasFetchedData, setHasFetchedData] = useState(false);

  // Animation values
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onSelectedItemsChange = (selectedItems: any) => {
    setSelectedItems(selectedItems);
  };

  console.log(userLocation);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedData) {
        fetchServiceData();
        setHasFetchedData(true);
      }
    }, [hasFetchedData]),
  );

  // Fetching Services
  const fetchServiceData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);
      const doc = await serviceRef.get();
      if (doc.exists) {
        const data = doc.data();
        dispatch(cleanerDescription(data?.description || ''));
        setSelectedItems(data?.type || []);
        setLocation(data?.location || '');
        setServiceData(data);
        dispatch(setUserLocation(data?.location))
      }
    } catch (error) {}
  };

  // Adding Services
  const addServices = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const finalLocation = userLocation || serviceData?.location;
    console.log('userLocation............', userLocation);

    const hasValidLocation =
      finalLocation &&
      (finalLocation.name ||
        finalLocation.address ||
        finalLocation.coordinates);

    console.log('serviceData............', serviceData);
    if (description && hasValidLocation && available && selectedItems) {
      try {
        setLoading(true);
        const serviceRef = await firestore()
          .collection('CleanerServices')
          .doc(user.uid)
          .set({
            createdAt: new Date(),
            name: profileData?.name,
            image: profileData?.profile,
            description: description,
            availability:
              available.length > 0 ? available : serviceData?.availability,
            type: selectedItems,
            location: finalLocation,
            serviceImages: serviceData?.serviceImages || [],
            packages: serviceData?.packages || [],
            rating: serviceData?.rating || null,
            reviews: serviceData?.reviews || [],
          });
        navigation.navigate('ServiceTwo');
      } catch (error) {
      } finally {
        setLoading(false);
      }
    } else {
      showToast({
        type: 'info',
        title: 'Adding Service Details',
        message: 'Please fill all the fields!',
      });
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const fields = [
      description,
      userLocation?.name || location?.name,
      selectedItems.length > 0,
    ];
    const filledFields = fields.filter(Boolean).length;
    return filledFields / fields.length;
  };

  const progress = calculateProgress();

  const availableDays = serviceData?.availability.filter(
    (item: any) => item.checked,
  ).length;

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Setup Your Services"
          textStyle={styles.headerText}
          left={true}
          right={false}
          style={{backgroundColor: 'transparent'}}
          arrowColor={'white'}
        />

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Setup Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <Progress.Bar
            progress={progress}
            width={width - 80}
            height={6}
            color="#FFFFFF"
            unfilledColor="rgba(255,255,255,0.3)"
            borderWidth={0}
            borderRadius={10}
            style={styles.progressBar}
          />
        </View>
      </LinearGradient>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <KeyboardAvoidingView
          // style={{flex: 1}}
          // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Form Container */}
            <Animated.View
              entering={FadeInUp.duration(600)}
              style={styles.formContainer}>
              {/* Location Card */}
              <Animated.View entering={SlideInRight.delay(100)}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Location', {location: true})
                  }
                  activeOpacity={0.7}
                  style={styles.locationCard}>
                  <LinearGradient
                    colors={
                      serviceData?.location?.name || userLocation?.name
                        ? ['#EFF6FF', '#e6effcff']
                        : ['#FFFFFF', '#F9FAFB']
                    }
                    style={styles.locationGradient}>
                    <View style={styles.locationContent}>
                      <View style={styles.locationIconContainer}>
                        <Image
                          source={Icons.location}
                          style={styles.locationIcon}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>
                          Service Location
                        </Text>
                        <Text
                          style={[
                            styles.locationValue,
                            !userLocation?.name &&
                              !serviceData?.location?.name &&
                              styles.placeholderText,
                          ]}>
                          {userLocation?.name ||
                            serviceData?.location?.name ||
                            'Tap to add your service location'}
                        </Text>
                      </View>
                      <View style={styles.locationArrow}>
                        <AntDesign
                          name="right"
                          size={RFPercentage(1.8)}
                          color={
                            userLocation?.name || serviceData?.location?.name
                              ? Colors.secondaryText
                              : '#9CA3AF'
                          }
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Description Card */}
              <Animated.View entering={SlideInRight.delay(200)}>
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.sectionIconContainer}>
                      <View style={styles.locationIconContainer}>
                        <MaterialIcons
                          name="texture"
                          size={RFPercentage(2)}
                          color={Colors.secondaryText}
                        />
                      </View>

                      <Text style={styles.sectionTitle}>
                        Service Description
                      </Text>
                    </View>
                  </View>
                  <DescriptionField
                    placeholder="Describe your services in detail..."
                    count={true}
                    value={description}
                    onChangeText={text => dispatch(cleanerDescription(text))}
                    maxLength={200}
                    style={styles.descriptionInput}
                  />
                </View>
              </Animated.View>

              {/* Availability Card */}
              <Animated.View entering={SlideInRight.delay(300)}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Availability')}
                  style={styles.availabilityCard}>
                  <LinearGradient
                    colors={
                      available.length > 0 ||
                      serviceData?.availability?.length > 0
                        ? ['#F0FDF4', '#DCFCE7']
                        : ['#FFFFFF', '#F9FAFB']
                    }
                    style={styles.availabilityGradient}>
                    <View style={styles.availabilityContent}>
                      <View style={styles.availabilityIconContainer}>
                        <Image
                          source={Icons.calendar}
                          style={styles.availabilityIcon}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.availabilityTextContainer}>
                        <Text style={styles.availabilityLabel}>
                          Availability
                        </Text>
                        <Text
                          style={[
                            styles.availabilityValue,
                            !available.length &&
                              !serviceData?.availability?.length &&
                              styles.placeholderText,
                          ]}>
                          {available.length > 0 ||
                          serviceData?.availability?.length > 0
                            ? `${availableDays} days set`
                            : 'Set your working days & hours'}
                        </Text>
                      </View>
                      <View style={styles.availabilityArrow}>
                        {available.length > 0 ||
                        serviceData?.availability?.length > 0 ? (
                          <Octicons
                            name="pencil"
                            color={'#22C55E'}
                            size={RFPercentage(2)}
                          />
                        ) : (
                          <AntDesign
                            name="right"
                            size={RFPercentage(1.8)}
                            color={
                              available.length > 0 ||
                              serviceData?.availability?.length > 0
                                ? Colors.gradient1
                                : '#9CA3AF'
                            }
                          />
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Services Selection Card */}
              <Animated.View entering={SlideInRight.delay(400)}>
                <View style={styles.servicesCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.sectionIconContainer}>
                      <View style={styles.locationIconContainer}>
                        <Ionicons
                          name="sparkles"
                          size={RFPercentage(2)}
                          color={Colors.secondaryText}
                        />
                      </View>
                      <Text style={styles.sectionTitle}>
                        Services You Provide
                      </Text>
                    </View>
                  </View>

                  <MultiSelect
                    hideTags={true}
                    items={items}
                    styleDropdownMenuSubsection={styles.dropdownMenu}
                    uniqueKey="id"
                    ref={multiSelectRef}
                    onSelectedItemsChange={onSelectedItemsChange}
                    selectedItems={selectedItems}
                    searchInputPlaceholderText="Search services..."
                    altFontFamily={Fonts.fontRegular}
                    // tagRemoveIconColor={Colors.gradient1}
                    tagBorderColor="#E5E7EB"
                    tagTextColor={Colors.gradient1}
                    selectedItemTextColor={Colors.gradient1}
                    selectedItemIconColor={Colors.gradient1}
                    itemTextColor="#6B7280"
                    displayKey="name"
                    searchInputStyle={styles.searchInput}
                    styleRowList={styles.rowList}
                    // submitButtonColor={Colors.gradient2}
                    submitButtonText="Save"
                    fontFamily={Fonts.fontRegular}
                    selectedItemFontFamily={Fonts.fontMedium}
                    itemFontFamily={Fonts.fontRegular}
                    itemFontSize={RFPercentage(1.7)}
                    hideSubmitButton
                    styleItemsContainer={styles.itemsContainer}
                    styleTextDropdownSelected={styles.dropdownTextSelected}
                    styleTextDropdown={styles.dropdownText}
                    styleTextTag={styles.tagText}
                    hideDropdown
                    textInputProps={{autoFocus: false}}
                    styleDropdownMenu={styles.dropdownStyle}
                  />

                  {/* Selected Services Tags */}
                  {selectedItems?.length > 0 && (
                    <Animated.View entering={ZoomIn.duration(400)}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.tagsContainer}>
                        {selectedItems.map((itemId: string) => {
                          const item = items.find(i => i.id === itemId);
                          return (
                            <View key={itemId} style={styles.serviceTag}>
                              <Image
                                source={item?.icon}
                                style={styles.tagIcon}
                                resizeMode="contain"
                              />
                              <Text style={styles.tagText}>{item?.name}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const newSelected = selectedItems.filter(
                                    id => id !== itemId,
                                  );
                                  setSelectedItems(newSelected);
                                }}
                                style={styles.tagClose}>
                                <AntDesign
                                  name="close"
                                  size={12}
                                  color="#6B7280"
                                />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </Animated.View>
                  )}

                  <Text style={styles.hintText}>
                    Select all services you offer to increase your visibility
                  </Text>
                </View>
              </Animated.View>

              {/* Continue Button */}
              <Animated.View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    progress < 1 && styles.buttonDisabled,
                  ]}
                  onPress={addServices}
                  disabled={loading || progress < 1}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={
                      progress < 1
                        ? ['#E5E7EB', '#D1D5DB']
                        : [Colors.gradient1, Colors.gradient2]
                    }
                    style={styles.buttonGradient}>
                    {loading ? (
                      <RNAnimated.View>
                        <Text style={styles.buttonText}>Saving...</Text>
                      </RNAnimated.View>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>
                          {profileCompletion === '100'
                            ? 'Update Service'
                            : 'Continue to Gallery'}
                        </Text>
                        <AntDesign
                          name="arrowright"
                          size={RFPercentage(2)}
                          color="#FFFFFF"
                          style={styles.buttonIcon}
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.progressHint}>
                  {progress < 1
                    ? `Complete all fields to continue (${Math.round(
                        progress * 100,
                      )}%)`
                    : 'All set! Ready to continue'}
                </Text>
              </Animated.View>
            </Animated.View>
          </KeyboardAvoidingView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default ServiceOne;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 8,
  },
  headerText: {
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  progressSection: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressPercent: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: '#FFFFFF',
  },
  progressBar: {
    marginTop: 4,
    alignSelf: 'center',
  },
  scrollContent: {
    // flexGrow: 1,
    // paddingBottom: RFPercentage(10),
  },
  timeLineContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  timeLineCard: {
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // elevation: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  locationCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  locationGradient: {
    padding: 18,
    borderRadius: 16,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 177, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.gradient1,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  locationLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: '#1F2937',
    marginBottom: 4,
  },
  locationValue: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontFamily: Fonts.fontRegular,
  },
  locationArrow: {
    paddingLeft: 10,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: Colors.gradient1,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: '#1F2937',
    marginLeft: RFPercentage(1.5),
  },
  counterContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: '#6B7280',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: '#374151',
  },
  availabilityCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  availabilityGradient: {
    padding: 18,
    borderRadius: 16,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityIcon: {
    width: 18,
    height: 18,
    tintColor: '#22C55E',
  },
  availabilityTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  availabilityLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: '#1F2937',
    marginBottom: 4,
  },
  availabilityValue: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: '#22C55E',
  },
  availabilityArrow: {
    paddingLeft: 10,
  },
  editIcon: {
    width: 16,
    height: 16,
  },
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  selectedCount: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.gradient1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    color: '#374151',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  rowList: {
    paddingVertical: RFPercentage(1.1),
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    maxHeight: 250,
  },
  dropdownTextSelected: {
    color: '#6B7280',
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    marginLeft: 12,
  },
  dropdownText: {
    color: '#6B7280',
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    marginLeft: 12,
  },
  tagText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.secondaryText,
  },
  dropdownStyle: {
    height: RFPercentage(5.5),
  },
  tagsContainer: {
    marginTop: 12,
    paddingBottom: 8,

    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  tagIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    // tintColor: Colors.gradient1,
  },
  tagClose: {
    marginLeft: 8,
    padding: 2,
  },
  hintText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  continueButton: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    // elevation: 8,
    width: '60%',
    alignSelf: 'center',
    height: RFPercentage(5.6),
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: '#FFFFFF',
    marginRight: 10,
  },
  buttonIcon: {
    marginTop: 2,
  },
  progressHint: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});
