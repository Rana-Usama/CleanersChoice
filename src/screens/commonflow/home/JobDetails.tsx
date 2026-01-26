import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useDispatch, useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {setJobId} from '../../../redux/Job/Actions';
import auth from '@react-native-firebase/auth';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

const {width} = Dimensions.get('window');

const JobDetails = ({route, navigation}: any) => {
  const {item} = route.params;
  const userData = useSelector((state: any) => state?.profile?.profileData);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [cleanerInfo, setCleanerInfo] = useState<any>(null);

  // Format date
  const formatDate = (dateString: string) => {
    return moment(dateString, 'YYYY-MM-DD  HH:mm A').format(
      'MMM DD, YYYY • hh:mm A',
    );
  };

  // Mark Complete
  const markComplete = async (jobId: string, newStatus: string) => {
    setLoading(true);
    try {
      await firestore().collection('Jobs').doc(jobId).update({
        status: newStatus,
        updatedAt: new Date(),
      });
      showSuccess('Job marked as completed!');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error marking job as complete:', error);
      showError('Failed to mark as complete');
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useDispatch();
  dispatch(setJobId(item.id));

  // Edit Button
  const handleEditButton = () => {
    setLoading2(true);
    setTimeout(() => {
      setLoading2(false);
      navigation.navigate('PostJob', {jobId: item.id});
    }, 1000);
  };

  // Generating Chat Id
  const user = auth().currentUser;
  const userId = user?.uid;
  const generateChatId = () => {
    return `${userId}_${item.id}`;
  };
  const chatId = generateChatId();
  const [existingChatId, setExistingChatId] = useState<string | null>(null);

  // Fetch client info (job poster)
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(item.jobId)
          .get();
        if (userDoc.exists) {
          setClientInfo(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    fetchClientInfo();
  }, [item.jobId]);

  // Fetch cleaner info (if assigned)
  useEffect(() => {
    const fetchCleanerInfo = async () => {
      if (item.assignedTo) {
        try {
          const userDoc = await firestore()
            .collection('Users')
            .doc(item.assignedTo)
            .get();
          if (userDoc.exists) {
            setCleanerInfo(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching cleaner data:', error);
        }
      }
    };
    fetchCleanerInfo();
  }, [item.assignedTo]);

  // Fetch existing id
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
      console.error('Error fetching existing chat ID:', error);
      return null;
    }
  };

  // Finding Chat
  useEffect(() => {
    const tryToFindChat = async () => {
      if (user?.uid && item?.jobId) {
        const chatId = await fetchExistingChatId(user.uid, item.jobId);
        if (chatId) {
          setExistingChatId(chatId);
        }
      }
    };
    tryToFindChat();
  }, [user?.uid, item?.jobId]);

  const cleanDescription = item.description.replace(/\s+/g, ' ').trim();
  const truncatedDescription =
    cleanDescription.length > 120
      ? cleanDescription.slice(0, 120) + '...'
      : cleanDescription;

  // Status Badge Component
  const StatusBadge = ({status}: any) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'active':
          return {
            color: '#10B981',
            bgColor: '#D1FAE5',
            text: 'Active',
            icon: 'check-circle',
          };
        case 'completed':
          return {
            color: '#6366F1',
            bgColor: '#E0E7FF',
            text: 'Completed',
            icon: 'check-circle',
          };
        case 'pending':
          return {
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            text: 'Pending',
            icon: 'clock',
          };
        case 'cancelled':
          return {
            color: '#EF4444',
            bgColor: '#FEE2E2',
            text: 'Cancelled',
            icon: 'close-circle',
          };
        default:
          return {
            color: Colors.gradient1,
            bgColor: '#E0F2FE',
            text: status,
            icon: 'information',
          };
      }
    };

    const config = getStatusConfig();

    return (
      <View style={[styles.statusBadge, {backgroundColor: config.bgColor}]}>
        <MaterialCommunityIcons
          name={config.icon}
          size={RFPercentage(1.6)}
          color={config.color}
        />
        <Text style={[styles.statusText, {color: config.color}]}>
          {config.text}
        </Text>
      </View>
    );
  };

  // Info Card Component
  const InfoCard = ({title, icon, children, style}: any) => (
    <View style={[styles.infoCard, style]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={RFPercentage(2.2)}
            color={Colors.gradient1}
          />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  // Toast simulation functions
  const showSuccess = (message: string) => {
    // You can integrate your toast system here
    console.log('Success:', message);
  };

  const showError = (message: string) => {
    // You can integrate your toast system here
    console.log('Error:', message);
  };

  const handleMessageClient = () => {
    setLoading3(true);
    setTimeout(() => {
      setLoading3(false);
      navigation.navigate('Chat', {
        chatId: existingChatId ? existingChatId : chatId,
        senderId: userId,
        senderName: userData?.name,
        receiver: item.jobId,
        receiverName: clientInfo?.name,
        receiverProfile: clientInfo?.profile,
        senderProfile: userData?.profile,
        fcmToken: clientInfo?.fcmToken,
      });
    }, 1000);
  };

  const getServiceIcon = (serviceType: string) => {
    const serviceIcons: Record<string, string> = {
      'Window Cleaning': 'window-open',
      'Chimney Cleaning': 'fireplace',
      'Carpet Cleaning': 'vacuum',
      'Car Cleaning': 'car-wash',
      'Residential Cleaning': 'home',
      'Pressure Washing': 'water-pump',
      'Lawn Care': 'leaf',
      Others: 'dots-horizontal',
    };
    return serviceIcons[serviceType] || 'tools';
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      {/* Modern Header */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
        scrollEventThrottle={16}>
        <View style={styles.headerSummary}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoRow}>
            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons
                name={getServiceIcon(item.type)}
                size={RFPercentage(2.5)}
                color={Colors.gradient1}
              />
              <Text style={styles.quickInfoLabel}>Service</Text>
              <Text style={styles.quickInfoValue}>{item.type}</Text>
            </View>

            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons
                name="cash"
                size={RFPercentage(2.5)}
                color={Colors.gradient1}
              />
              <Text style={styles.quickInfoLabel}>Budget</Text>
              <Text style={styles.quickInfoValue}>${item.priceRange}</Text>
            </View>

            <View style={styles.quickInfoCard}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={RFPercentage(2.5)}
                color={Colors.gradient1}
              />
              <Text style={styles.quickInfoLabel}>Due Date</Text>
              <Text style={styles.quickInfoValue} numberOfLines={2}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Description Card */}
        <InfoCard title="Job Description" icon="text-box-outline">
          <Text style={styles.descriptionText}>
            {isDescriptionExpanded ? cleanDescription : truncatedDescription}
          </Text>
          {cleanDescription.length > 120 && (
            <TouchableOpacity
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
              <Feather
                name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
          )}
        </InfoCard>

        {/* Location Card */}
        <InfoCard title="Location" icon="map-marker-outline">
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color="#EF4444" />
            <Text style={styles.locationText}>
              {item.location?.name || 'Location not specified'}
            </Text>
          </View>
          {item.location?.coordinates && (
            <TouchableOpacity style={styles.viewMapButton}>
              <Feather name="map" size={16} color="#FFFFFF" />
              <Text style={styles.viewMapText}>View on Map</Text>
            </TouchableOpacity>
          )}
        </InfoCard>

        {/* Client Information */}
        {clientInfo && (
          <InfoCard title="Client Information" icon="account-tie-outline">
            <View style={styles.userInfoContainer}>
              <Image
                source={
                  clientInfo.profile
                    ? {uri: clientInfo.profile}
                    : IMAGES.defaultPic
                }
                style={styles.userAvatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{clientInfo.name}</Text>
                <View style={styles.userMeta}>
                  {/* <View style={styles.userMetaItem}>
                    <MaterialCommunityIcons
                      name="phone"
                      size={14}
                      color={Colors.secondaryText}
                    />
                    <Text style={styles.userMetaText}>
                      {clientInfo.phone || 'Not provided'}
                    </Text>
                  </View> */}
                  <View style={styles.userMetaItem}>
                    <MaterialCommunityIcons
                      name="email"
                      size={14}
                      color={Colors.secondaryText}
                    />
                    <Text style={styles.userMetaText}>
                      {clientInfo.email || 'Not provided'}
                    </Text>
                  </View>
                </View>
                {/* <View style={styles.userRating}>
                  <FontAwesome name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>4.8</Text>
                  <Text style={styles.reviewsText}>(24 reviews)</Text>
                </View> */}
              </View>
            </View>
          </InfoCard>
        )}

        {/* Assigned Cleaner (if applicable) */}
        {cleanerInfo && userData.role === 'Customer' && (
          <InfoCard title="Assigned Professional" icon="account-hard-hat">
            <View style={styles.userInfoContainer}>
              <Image
                source={
                  cleanerInfo.profile
                    ? {uri: cleanerInfo.profile}
                    : IMAGES.defaultPic
                }
                style={styles.userAvatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{cleanerInfo.name}</Text>
                <Text style={styles.userRole}>Professional Cleaner</Text>
                <View style={styles.cleanerStats}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.statText}>Verified</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FontAwesome name="star" size={14} color="#FBBF24" />
                    <Text style={styles.statText}>4.9 (56)</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="briefcase-check"
                      size={14}
                      color={Colors.gradient1}
                    />
                    <Text style={styles.statText}>120+ jobs</Text>
                  </View>
                </View>
              </View>
            </View>
          </InfoCard>
        )}

        {/* Special Instructions */}
        {item.remarks && (
          <InfoCard title="Special Instructions" icon="message-text-outline">
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </InfoCard>
        )}

        {/* Spacer for buttons */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.actionBar}>
        {item.status === 'active' && userData.role === 'Customer' ? (
          <View style={styles.actionButtons}>
            <NextButton
              title="Edit Job"
              onPress={handleEditButton}
              textStyle={styles.editButtonText}
              disabled={loading2 || loading}
              loading={loading2}
              style={styles.editButton}
            />
            <GradientButton
              title="Mark Complete"
              textStyle={styles.completeButtonText}
              onPress={() => markComplete(item.id, 'completed')}
              loading={loading}
              disabled={loading}
              style={styles.completeButton}
            />
          </View>
        ) : userData.role === 'Cleaner' && item.status === 'active' ? (
          <GradientButton
            title="Message Client"
            textStyle={styles.messageButtonText}
            onPress={handleMessageClient}
            loading={loading3}
            disabled={loading3}
            style={styles.messageButton}
          />
        ) : item.status === 'completed' ? (
          <View style={styles.completedState}>
            <MaterialCommunityIcons
              name="check-circle"
              size={RFPercentage(2.5)}
              color="#10B981"
            />
            <Text style={styles.completedText}>Job Completed</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(4),
    // paddingBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
  },
  headerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitle: {
    color: '#5e687bff',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    flex: 1,
    marginRight: RFPercentage(1),
    lineHeight: RFPercentage(2.8),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: 20,
    gap: RFPercentage(0.5),
  },
  statusText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.2),
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(15),
  },
  quickInfoContainer: {
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  quickInfoRow: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: RFPercentage(1.5),
    alignItems: 'center',
    marginHorizontal: RFPercentage(0.5),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    marginTop: RFPercentage(1),
  },
  quickInfoLabel: {
    color: Colors.secondaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    marginLeft: RFPercentage(0.5),
  },
  quickInfoValue: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    textAlign: 'center',
    marginLeft: RFPercentage(1),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1),
  },
  cardIcon: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  readMoreText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    backgroundColor: '#F8FAFC',
    padding: RFPercentage(1.5),
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
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gradient1,
    padding: RFPercentage(1.2),
    borderRadius: 12,
    marginTop: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  viewMapText: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  timelineContainer: {
    paddingLeft: RFPercentage(1),
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: RFPercentage(5),
  },
  timelineDot: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(1.1),
    backgroundColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.5),
    marginTop: RFPercentage(0.3),
  },
  timelineDotPending: {
    backgroundColor: '#E5E7EB',
  },
  timelineInnerDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: '#FFFFFF',
  },
  timelineConnector: {
    width: 2,
    height: RFPercentage(3),
    backgroundColor: '#E5E7EB',
    marginLeft: RFPercentage(1.1),
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.3),
  },
  timelineTime: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1.5),
  },
  userAvatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.3),
  },
  userRole: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.5),
  },
  userMeta: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    gap: RFPercentage(1),
    // marginBottom: RFPercentage(0.5),
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
  },
  userMetaText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  userRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
  },
  ratingText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginLeft: RFPercentage(0.3),
  },
  reviewsText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginLeft: RFPercentage(0.3),
  },
  cleanerStats: {
    flexDirection: 'row',
    gap: RFPercentage(1.5),
    marginTop: RFPercentage(0.5),
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
  remarksText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.2),
  },
  spacer: {
    height: RFPercentage(2),
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: RFPercentage(2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: RFPercentage(1.5),
  },
  editButton: {
    // flex: 0.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.gradient1,
    borderRadius: 20,
    width: RFPercentage(15),
  },
  editButtonText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
  completeButton: {
    flex: 3,
    borderRadius: 20,
  },
  completeButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  messageButton: {
    width: '60%',
    alignSelf:"center"
  },
  messageButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  completedState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    padding: RFPercentage(1.8),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: RFPercentage(1),
  },
  completedText: {
    color: '#065F46',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
  },
});
