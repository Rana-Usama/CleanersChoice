import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  StatusBar,
  Animated,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Feather from 'react-native-vector-icons/Feather';
import ImageView from 'react-native-image-viewing';
import ServicePackage from '../../../components/ServicePackage';

import CustomModal from '../../../components/CustomModal';
import {BlurView} from '@react-native-community/blur';

const {width} = Dimensions.get('window');

const items = [
  {
    id: '11',
    name: 'Window Cleaning',
    icon: 'window-open',
  },
  {
    id: '22',
    name: 'Chimney Cleaning',
    icon: 'fireplace',
  },
  {
    id: '33',
    name: 'Carpet Cleaning',
    icon: 'vacuum',
  },
  {
    id: '44',
    name: 'Residential Cleaning',
    icon: 'home',
  },
  {
    id: '55',
    name: 'Pressure Washing',
    icon: 'water-pump',
  },
  {
    id: '66',
    name: 'Car Washing',
    icon: 'car-wash',
  },
  {
    id: '77',
    name: 'Lawn Care',
    icon: 'leaf',
  },
  {
    id: '88',
    name: 'Others',
    icon: 'dots-horizontal',
  },
];

const ServiceDetails: React.FC = ({route}: any) => {
  const {item} = route.params;
  const [visibleItems, setVisibleItems] = useState(5);
  const navigation = useNavigation<any>();
  const profileData = useSelector((state: any) => state.profile.profileData);
  const [loading, setloading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [visible, setIsVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageModalVisible, setPackageModalVisible] = useState(false);

  console.log('selectedPackage.........', selectedPackage);

  const toggleDescription = () => {
    setIsExpanded(prevState => !prevState);
  };

  const [step, setStep] = useState(0);
  const scrollViewRef = useRef(null);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);

    if (index !== step) {
      setStep(index);
      setActiveImageIndex(index);
    }
  };

  const handleShowMore = () => {
    setVisibleItems(prev => Math.min(prev + 5, item.type.length));
  };

  const handleShowLess = () => {
    setVisibleItems(5);
  };

  const getServiceWithIcon = (serviceId: any) => {
    return items.find(service => service.id === serviceId);
  };

  const serviceNames = item?.type
    ?.slice(0, visibleItems)
    .map((id: any) => getServiceWithIcon(id));
  const createdAtDate = new Date(item.createdAt._seconds * 1000);
  const formattedDate = moment(createdAtDate).format('DD MMMM, YYYY');
  const relativeDate = moment(createdAtDate).fromNow();
  const userFlow = useSelector((state: any) => state.userFlow.userFlow);
  const imageObjects =
    item?.serviceImages?.map((url: any) => ({uri: url})) || [];

  const getTruncatedText = (text: any) => {
    const maxChars = 120;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const user = auth().currentUser;
  const userId = user?.uid;
  const generateChatId = () => {
    return `${userId}_${item.id}`;
  };
  const chatId = generateChatId();
  const [existingChatId, setExistingChatId] = useState<string | null>(null);

  const fetchExistingChatId = async (userId1: any, userId2: any) => {
    try {
      const chatsSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId1)
        .get();

      for (const doc of chatsSnapshot.docs) {
        const chatData = doc.data();
        const participants = chatData.participants || [];

        if (participants.includes(userId1) && participants.includes(userId2)) {
          return doc.id;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const tryToFindChat = async () => {
      if (user?.uid && item?.jobId) {
        const chatId = await fetchExistingChatId(userId, item.id);
        if (chatId) {
          setExistingChatId(chatId);
        }
      }
    };
    tryToFindChat();
  }, [userId, item?.id]);

  const [token, setFcmToken] = useState<string>('');
  useEffect(() => {
    fetchToken(item.id);
  }, []);

  const fetchToken = async (id: any) => {
    try {
      const userDoc = await firestore().collection('Users').doc(id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setFcmToken(userData?.fcmToken);
      }
    } catch (error) {}
  };

  const cleanDescription = item.description.replace(/\s+/g, ' ').trim();



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(15)}}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
        scrollEventThrottle={16}>
        {/* Image Gallery with Gradient Overlay */}
        <View style={styles.imageGalleryContainer}>
          <ScrollView
            horizontal
            onScroll={onScroll}
            ref={scrollViewRef}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={styles.imageScrollView}>
            {item.serviceImages.map((image: any, index: any) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => {
                  setStep(index);
                  setIsVisible(true);
                }}>
                <Image
                  source={typeof image === 'string' ? {uri: image} : image}
                  resizeMode="cover"
                  style={styles.coverImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
                  style={styles.imageGradient}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={{
              position: 'absolute',
              top: RFPercentage(2),
              left: RFPercentage(2),
              width: RFPercentage(4.5),
              height: RFPercentage(4.5),
              borderRadius: RFPercentage(100),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}>
            <Feather
              name="arrow-left"
              color={Colors.background}
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>

          {/* Image Counter */}
          {item?.serviceImages?.length > 1 && (
            <View style={styles.imageCounter}>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {activeImageIndex + 1} / {item.serviceImages.length}
                </Text>
              </View>
            </View>
          )}

          {/* Dots Indicator */}
          {item?.serviceImages?.length > 1 && (
            <View style={styles.dotsContainer}>
              {item.serviceImages.map((_: any, index: any) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={index}
                  onPress={() => {
                    setStep(index);
                    setActiveImageIndex(index);
                    scrollViewRef?.current?.scrollTo({
                      x: width * index,
                      animated: true,
                    });
                  }}>
                  {step === index ? (
                    <LinearGradient
                      colors={[Colors.gradient1, Colors.gradient2]}
                      style={styles.activeDot}
                    />
                  ) : (
                    <View style={styles.inactiveDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Main Content Container */}
        <View style={styles.contentContainer}>
          <View style={styles.serviceHeaderCard}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              style={styles.serviceBadge}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.serviceBadgeText}>Premium Service</Text>
            </LinearGradient>

            <View style={styles.serviceTitleRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
                style={styles.profileImageContainer}>
                <Image
                  source={item.image ? {uri: item.image} : IMAGES.defaultPic}
                  resizeMode="cover"
                  style={styles.profileImage}
                />
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.serviceTitleContainer}>
                <Text style={styles.serviceName}>{item.name}</Text>
                {/* <View style={styles.ratingContainer}>
                  <FontAwesome name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>5.0</Text>
                  <Text style={styles.reviewsText}>(24 reviews)</Text>
                </View> */}
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  if (userFlow === 'Guest') {
                    setShowAuthModal(true);
                    return;
                  }

                  navigation.navigate('Chat', {
                    chatId: existingChatId ? existingChatId : chatId,
                    senderId: profileData.uid,
                    senderName: profileData.name,
                    receiver: item.id,
                    receiverName: item.name,
                    receiverProfile: item.image,
                    senderProfile: profileData.profile,
                    fcmToken: token,
                  });
                }}>
                <Fontisto name="hipchat" size={20} color={Colors.gradient1} />
              </TouchableOpacity>
            </View>

            <View style={styles.metaInfoContainer}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={Colors.secondaryText}
                />
                <Text style={styles.metaText}>Posted {relativeDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colors.secondaryText}
                />
                <Text style={styles.metaText}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AntDesign name="setting" size={20} color={Colors.gradient1} />
              <Text style={styles.cardTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>
              {isExpanded
                ? cleanDescription
                : getTruncatedText(cleanDescription)}
              {cleanDescription?.length > 120 && (
                <Text onPress={toggleDescription} style={styles.readMoreText}>
                  {isExpanded ? ' Show less' : ' Read more'}
                </Text>
              )}
            </Text>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="location-outline"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.cardTitle}>Location</Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name="pin" size={16} color="#EF4444" />
              <Text style={styles.locationText}>
                {item?.location?.name || 'Location not specified'}
              </Text>
            </View>
          </View>

          {/* Availability Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.cardTitle}>Availability</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() =>
                navigation.navigate('CheckAvailability', {item: item})
              }
              style={styles.availabilityButton}>
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                style={styles.availabilityGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.availabilityButtonText}>
                  Check Availability Schedule
                </Text>
                <Feather name="chevron-right" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Services Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.cardTitle}>Services Offered</Text>
            </View>

            <View style={styles.servicesGrid}>
              {serviceNames.map(
                (service: any, index: any) =>
                  service && (
                    <View key={index} style={styles.serviceChip}>
                      <MaterialCommunityIcons
                        name={service.icon}
                        size={16}
                        color={Colors.gradient1}
                      />
                      <Text style={styles.serviceChipText}>
                        {service.name.length > 12
                          ? `${service.name.slice(0, 12)}...`
                          : service.name}
                      </Text>
                    </View>
                  ),
              )}
            </View>

            {item.type.length > 5 && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.showMoreButton}
                onPress={
                  visibleItems < item.type.length
                    ? handleShowMore
                    : handleShowLess
                }>
                <Text style={styles.showMoreText}>
                  {visibleItems < item.type.length
                    ? `View ${item.type.length - visibleItems} more services`
                    : `Show less`}
                </Text>
                <Feather
                  name={
                    visibleItems < item.type.length
                      ? 'chevron-down'
                      : 'chevron-up'
                  }
                  size={16}
                  color={Colors.gradient1}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Packages Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="package-variant"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.cardTitle}>Available Packages</Text>
            </View>

            <View style={styles.packagesHeader}>
              <View>
                <Text style={styles.startingFromText}>Starting from</Text>
                <Text style={styles.startingPrice}>
                  ${item.packages?.[0]?.price || 0}
                </Text>
              </View>
              <View style={styles.bestValueBadge}>
                <MaterialCommunityIcons
                  name="crown"
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.bestValueText}>Best Value</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.packagesScroll}>
              {item.packages.map((pkg: any, index: any) => (
                <ServicePackage
                  key={index}
                  name={`${pkg.name || `Package ${index + 1}`}`}
                  price={pkg.price}
                  detail={pkg.details}
                  onPress={() => {
                    setSelectedPackage(pkg);
                    setPackageModalVisible(true);
                  }}
                  // isSelected
                  // isFeatured
                />
              ))}
            </ScrollView>
          </View>

          {/* Service Provider Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="account-tie"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.cardTitle}>Service Provider</Text>
            </View>

            <View style={styles.providerInfo}>
              <Image
                source={item.image ? {uri: item.image} : IMAGES.defaultPic}
                resizeMode="cover"
                style={styles.providerImage}
              />
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>{item.name}</Text>
                <View style={styles.providerStats}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.statText}>Verified</Text>
                  </View>
                  {/* <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#FFD700"
                    />
                    <Text style={styles.statText}>5.0 (24)</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="briefcase-check"
                      size={14}
                      color={Colors.gradient1}
                    />
                    <Text style={styles.statText}>50+ jobs</Text>
                  </View> */}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.startingFrom}>Starting from</Text>
          <Text style={styles.bottomPrice}>
            ${item.packages?.[0]?.price || 0}
          </Text>
        </View>

        <GradientButton
          title="Get Custom Offer"
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          onPress={() => {
            if (userFlow === 'Guest') {
              setShowAuthModal(true);
              return;
            }
            setloading(true);
            setTimeout(() => {
              setloading(false);
              navigation.navigate('Chat', {
                chatId: existingChatId ? existingChatId : chatId,
                senderId: profileData.uid,
                senderName: profileData.name,
                receiver: item.id,
                receiverName: item.name,
                receiverProfile: item.image,
                senderProfile: profileData.profile,
                fcmToken: token,
              });
            }, 1000);
          }}
          loading={loading}
        />
      </View>

      {/* Full Screen Image Modal */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          transparent
          onRequestClose={() => setModalVisible(false)}
          animationType="fade">
          <View style={styles.fullScreenModal}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setModalVisible(false)}
              style={styles.closeModalButton}>
              <AntDesign name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={item.image ? {uri: item.image} : IMAGES.defaultPic}
              resizeMode="contain"
              style={styles.fullScreenImage}
            />
          </View>
        </Modal>
      )}

      {/* Authentication Required Modal */}
      {showAuthModal && (
        <TouchableWithoutFeedback onPress={() => setShowAuthModal(false)}>
          <View style={styles.authModalContainer}>
            <BlurView style={styles.blurView} blurType="dark" blurAmount={10} />
            <CustomModal
              title="Login Required"
              subTitle="You need to sign in or create an account to contact service providers and get custom offers."
              onPress={() => setShowAuthModal(false)}
              onPress2={() => {
                setShowAuthModal(false);
                navigation.navigate('UserSelection');
              }}
              buttonTitle="Continue to Login"
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      <ImageView
        images={imageObjects}
        imageIndex={step}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        backgroundColor="rgba(0,0,0,0.9)"
        presentationStyle="fullScreen"
      />

      {packageModalVisible && selectedPackage && (
        <Modal
          visible={packageModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setPackageModalVisible(false)}>
          <View style={styles.packageModalContainer}>
            <BlurView style={styles.blurView} blurType="dark" blurAmount={10} />
            <View style={styles.packageModalContent}>
              {/* Modal Header */}
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                style={styles.packageModalHeader}>
                <Text style={styles.packageModalTitle}>{item?.name}</Text>
                <TouchableOpacity
                  onPress={() => setPackageModalVisible(false)}
                  style={styles.packageModalClose}>
                  <AntDesign name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>

              {/* Modal Body */}
              <ScrollView style={styles.packageModalBody}>
                <View style={styles.packagePriceSection}>
                  <Text style={styles.packageModalPriceLabel}>Price</Text>
                  <View style={styles.packagePriceRow}>
                    <Text style={styles.packageModalCurrency}>$</Text>
                    <Text style={styles.packageModalPrice}>
                      {selectedPackage?.price}
                    </Text>
                    <Text style={styles.packageModalPriceUnit}>/service</Text>
                  </View>
                </View>

                <View style={styles.packageDetailSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="text-box-outline"
                      size={20}
                      color={Colors.gradient1}
                    />
                    <Text style={styles.sectionTitle}>What's Included</Text>
                  </View>
                  <Text style={styles.packageDetailText}>
                    {selectedPackage?.details}
                  </Text>
                </View>

                {/* Add additional package details if available */}
                {selectedPackage?.services && (
                  <View style={styles.packageServicesSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                      <Text style={styles.sectionTitle}>Services Included</Text>
                    </View>
                    {selectedPackage?.services.map((service, index) => (
                      <View key={index} style={styles.serviceItem}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={16}
                          color={Colors.gradient1}
                        />
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.packageModalFooter}>
                <GradientButton
                  title="Get Package Offer"
                  style={styles.selectPackageButton}
                  textStyle={{fontSize: RFPercentage(1.6)}}
                  onPress={() => {
                    if (userFlow === 'Guest') {
                      setShowAuthModal(true);
                      return;
                    }

                    navigation.navigate('Chat', {
                      chatId: existingChatId ? existingChatId : chatId,
                      senderId: profileData.uid,
                      senderName: profileData.name,
                      receiver: item.id,
                      receiverName: item.name,
                      receiverProfile: item.image,
                      senderProfile: profileData.profile,
                      fcmToken: token,
                    });

                    setPackageModalVisible(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  headerText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  imageGalleryContainer: {
    height: RFPercentage(35),
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  imageScrollView: {
    width: width,
    height: RFPercentage(35),
  },
  coverImage: {
    width: width,
    height: RFPercentage(35),
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: RFPercentage(15),
  },
  imageCounter: {
    position: 'absolute',
    top: RFPercentage(2),
    right: RFPercentage(2),
  },
  counterBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeDot: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
    marginHorizontal: RFPercentage(0.3),
  },
  inactiveDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.3),
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  contentContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(15),
  },
  serviceHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 5,
     borderWidth: 1,
    borderColor: '#F3F4F6',
    borderBottomWidth: 2,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 20,
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: RFPercentage(1.5),
  },
  profileImage: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.gradient1,
    borderRadius: 10,
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  serviceTitleContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.3),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
  },
  ratingText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginLeft: RFPercentage(0.3),
  },
  reviewsText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginLeft: RFPercentage(0.5),
  },
  shareButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInfoContainer: {
    flexDirection: 'row',
    gap: RFPercentage(2),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
  },
  metaText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
     borderWidth: 1,
    borderColor: '#F3F4F6',
    borderBottomWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1),
  },
  cardTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  descriptionText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.2),
  },
  readMoreText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    backgroundColor: '#F8FAFC',
    padding: RFPercentage(1.2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.primaryText,
    flex: 1,
  },
  availabilityButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  availabilityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.5),
    gap: RFPercentage(1),
  },
  availabilityButtonText: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFPercentage(1),
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 20,
    gap: RFPercentage(0.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceChipText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  showMoreText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  packagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
  },
  startingFromText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  startingPrice: {
    fontSize: RFPercentage(2.4),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
  },
  bestValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 12,
    gap: RFPercentage(0.3),
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontMedium,
  },
  packagesScroll: {
    marginHorizontal: -RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1.5),
  },
  providerImage: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.5),
  },
  providerStats: {
    flexDirection: 'row',
    gap: RFPercentage(1.5),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
  },
  statText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    borderTopWidth:1,
    borderTopColor:"#eaeaeaff"

  },
  priceContainer: {
    flex: 1,
  },
  startingFrom: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  bottomPrice: {
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
  },
  actionButton: {
    flex: 2,
    marginLeft: RFPercentage(1),
  },
  actionButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? RFPercentage(6) : RFPercentage(4),
    right: RFPercentage(2),
    zIndex: 2,
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '90%',
  },
  authModalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  packageModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  packageModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  packageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RFPercentage(2),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  packageModalTitle: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
  },
  packageModalClose: {
    padding: RFPercentage(0.5),
  },
  packageModalBody: {
    padding: RFPercentage(2),
  },
  packagePriceSection: {
    alignItems: 'center',
    marginBottom: RFPercentage(2),
  },
  packageModalPriceLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    marginBottom: RFPercentage(0.5),
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packageModalCurrency: {
    color: Colors.gradient1,
    fontSize: RFPercentage(2),
    fontFamily: Fonts.fontMedium,
  },
  packageModalPrice: {
    color: Colors.gradient1,
    fontSize: RFPercentage(3.5),
    fontFamily: Fonts.fontBold,
    marginHorizontal: RFPercentage(0.5),
  },
  packageModalPriceUnit: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  packageDetailSection: {
    marginBottom: RFPercentage(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.8),
  },
  sectionTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  packageDetailText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    lineHeight: RFPercentage(2.2),
  },
  packageServicesSection: {
    marginBottom: RFPercentage(2),
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.8),
    gap: RFPercentage(0.8),
  },
  serviceText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    flex: 1,
  },
  packageModalFooter: {
    padding: RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectPackageButton: {
    marginBottom: RFPercentage(1),
    alignSelf: 'center',
  },
  customizeButton: {
    padding: RFPercentage(1.5),
    alignItems: 'center',
  },
  customizeText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
});
