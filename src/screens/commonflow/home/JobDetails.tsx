import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useDispatch, useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {setJobId} from '../../../redux/Job/Actions';
import auth from '@react-native-firebase/auth';

const JobDetails = ({route, navigation}: any) => {
  const {item} = route.params;
  const userData = useSelector(state => state?.profile?.profileData);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  // Mark Complete
  const markComplete = async (jobId: string, newStatus: string) => {
    setLoading(true);
    try {
      await firestore().collection('Jobs').doc(jobId).update({
        status: newStatus,
        updatedAt:new Date(),
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error marking job as complete:', error);
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
  const [existingChatId, setExistingChatId] = useState(null);

  // User Data
  const [userInfo, setUserInfo] = useState([]);
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
        setUserInfo(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Other user
  const [otherUser, setOtherUser] = useState([]);
  useEffect(() => {
    otherUserData();
  }, []);
  const otherUserData = async () => {
    try {
      const userDoc = await firestore()
        .collection('Users')
        .doc(item.jobId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setOtherUser(userData);
      }
    } catch (error) {
      console.error('Error fetching other user data:', error);
    }
  };

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

  // Status Badge Component
  const StatusBadge = ({status}) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'active':
          return {
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            text: 'Active',
            icon: Icons.active,
          };
        case 'completed':
          return {
            color: '#52617dff',
            bgColor: 'rgba(126, 191, 241, 0.1)',
            text: 'Completed',
            icon: Icons.verify,
          };
        case 'pending':
          return {
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            text: 'Pending',
            icon: Icons.clock,
          };
        default:
          return {
            color: Colors.gradient1,
            bgColor: 'rgba(199, 212, 234, 0.3)',
            text: status,
            icon: Icons.info,
          };
      }
    };

    const config = getStatusConfig();

    return (
      <View style={[styles.statusBadge, {backgroundColor: config.bgColor}]}>
        <View
          style={{
            width: RFPercentage(0.6),
            height: RFPercentage(0.6),
            backgroundColor: config.color,
            borderRadius: RFPercentage(100),
            marginRight: RFPercentage(0.6),
          }}></View>
        <Text style={[styles.statusText, {color: config.color}]}>
          {config.text}
        </Text>
      </View>
    );
  };

  // Detail Row Component
  const DetailRow = ({icon, label, value, isDescription = false}) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Image
          source={icon}
          resizeMode="contain"
          style={styles.detailIcon}
          tintColor={Colors.gradient1}
        />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text
          style={isDescription ? styles.detailDescription : styles.detailValue}
          numberOfLines={isDescription ? undefined : 2}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <HeaderBack
        title="Job Details"
        textStyle={styles.headerText}
        left={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.jobMeta}>
            <View style={styles.serviceType}>
              <Image
                source={Icons.category}
                resizeMode="contain"
                style={styles.serviceIcon}
                tintColor={Colors.gradient1}
              />
              <Text style={styles.serviceText}>{item.type}</Text>
            </View>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>${item.priceRange}</Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Information</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.detailsCard}>
            <DetailRow
              icon={Icons.bars}
              label="Description"
              value={cleanDescription}
              isDescription={true}
            />

            <View style={styles.divider} />

            <DetailRow
              icon={Icons.location}
              label="Location"
              value={item.location}
            />

            <View style={styles.divider} />

            <DetailRow
              icon={Icons.calendar}
              label="Due Date & Time"
              value={item.createdAt}
            />

            <View style={styles.divider} />

            <DetailRow
              icon={Icons.priceRange}
              label="Budget"
              value={`$${item.priceRange}`}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {item.status === 'active' && userData.role === 'Customer' ? (
            <View style={styles.buttonContainer}>
              <NextButton
                title="Edit Job Post"
                onPress={handleEditButton}
                textStyle={styles.buttonText}
                disabled={loading2 || loading}
                loading={loading2}
                style={styles.editButton}
              />
              <View style={styles.buttonSpacer} />
              <GradientButton
                title="Mark as Complete"
                textStyle={styles.buttonText}
                onPress={() => markComplete(item.id, 'completed')}
                loading={loading}
                disabled={loading}
                style={styles.completeButton}
              />
            </View>
          ) : userData.role === 'Cleaner' ? (
            <View style={styles.buttonContainer}>
              <GradientButton
                title="Message Client"
                textStyle={styles.buttonText}
                onPress={() => {
                  setLoading3(true);
                  setTimeout(() => {
                    setLoading3(false);
                    navigation.navigate('Chat', {
                      chatId: existingChatId ? existingChatId : chatId,
                      senderId: userId,
                      senderName: userInfo?.name,
                      receiver: item.jobId,
                      receiverName: otherUser?.name,
                      receiverProfile: otherUser?.profile,
                      senderProfile: userInfo?.profile,
                      fcmToken: otherUser.fcmToken,
                    });
                  }, 1000);
                }}
                loading={loading3}
                disabled={loading3}
                style={styles.messageButton}
              />
            </View>
          ) : (
            <View style={styles.completedState}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={styles.completedIcon}
                tintColor={'#059669'}
              />
              <Text style={styles.completedText}>Job Completed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: RFPercentage(3),
  },
  headerText: {
    fontSize: RFPercentage(2.2),
  },

  // Header Section
  headerSection: {
    backgroundColor: 'white',
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    padding: RFPercentage(2.5),
    borderRadius: RFPercentage(2),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(1.5),
  },
  jobTitle: {
    color: '#334156ff',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    flex: 1,
    lineHeight: RFPercentage(3),
    marginRight: RFPercentage(1),
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 248, 252, 0.9)',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
  },
  serviceIcon: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    marginRight: RFPercentage(0.6),
  },
  serviceText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  budgetBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
  },
  budgetText: {
    color: '#16A34A',
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.6),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(1.5),
    marginLeft: RFPercentage(1),
  },
  statusIcon: {
    width: RFPercentage(1.4),
    height: RFPercentage(1.4),
    marginRight: RFPercentage(0.4),
  },
  statusText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.3),
  },

  // Details Section
  detailsSection: {
    marginTop: RFPercentage(2),
    marginHorizontal: RFPercentage(2),
  },
  sectionHeader: {
    marginBottom: RFPercentage(1.5),
  },
  sectionTitle: {
    color: '#374151',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    marginBottom: RFPercentage(1),
  },
  sectionDivider: {
    height: 2,
    backgroundColor: 'rgba(69, 93, 118, 0.2)',
    borderRadius: 1,
    width: '35%',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(2),
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(219, 222, 226, 0.6)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: RFPercentage(1),
  },
  detailIconContainer: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(161, 198, 241, 0.08)',
    marginRight: RFPercentage(1.5),
    marginTop: RFPercentage(0.2),
  },
  detailIcon: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#424b5eff',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    marginBottom: RFPercentage(0.3),
  },
  detailValue: {
    color: '#3b4655ff',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2.2),
  },
  detailDescription: {
    color: '#1F2937',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.8)',
    marginVertical: RFPercentage(0.5),
  },

  // Actions Section
  actionsSection: {
    marginTop: RFPercentage(3),
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
    marginRight: RFPercentage(1),
  },
  completeButton: {
    marginLeft: RFPercentage(1),
  },
  messageButton: {
    width: '40%',
  },
  buttonSpacer: {
    width: RFPercentage(1),
  },
  buttonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
  },
  completedState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  completedIcon: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    marginRight: RFPercentage(1),
  },
  completedText: {
    color: '#059669',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
  },
});
