import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import NotFound from '../../../components/NotFound';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {showToast} from '../../../utils/ToastMessage';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../components/CustomModal';

const SERVER_URL = 'https://cleaners-choice-server.vercel.app';

interface CleanerData {
  uid: string;
  name: string;
  email: string;
  profile: string | null;
  phone: string;
  fcmToken: string;
}

const JobManagement = ({route, navigation}: any) => {
  const {jobId, jobTitle} = route.params;
  const [applicants, setApplicants] = useState<CleanerData[]>([]);
  const [confirmedCleaner, setConfirmedCleaner] = useState<CleanerData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [cancelledCleaners, setCancelledCleaners] = useState<string[]>([]);
  const [selfCancelledCleaners, setSelfCancelledCleaners] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    subTitle: string;
    iconName: string;
    iconColor: string;
    buttonTitle: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    subTitle: '',
    iconName: '',
    iconColor: '',
    buttonTitle: 'Yes',
    onConfirm: () => {},
  });

  const fetchJobData = useCallback(async () => {
    setLoading(true);
    try {
      const jobDoc = await firestore().collection('Jobs').doc(jobId).get();
      if (!jobDoc.exists) {
        setLoading(false);
        return;
      }
      const job = jobDoc.data();
      setJobData(job);
      setCancelledCleaners(job?.cancelledCleaners || []);
      setSelfCancelledCleaners(job?.selfCancelledCleaners || []);

      // Fetch confirmed cleaner info
      if (job?.confirmedCleaner) {
        const cleanerDoc = await firestore()
          .collection('Users')
          .doc(job.confirmedCleaner)
          .get();
        if (cleanerDoc.exists) {
          setConfirmedCleaner({
            uid: cleanerDoc.id,
            ...cleanerDoc.data(),
          } as CleanerData);
        }
      } else {
        setConfirmedCleaner(null);
      }

      // Fetch applicants info
      const applicantIds: string[] = job?.applicants || [];
      if (applicantIds.length > 0) {
        // Filter out confirmed cleaner from applicants list
        const filteredIds = applicantIds.filter(
          id => id !== job?.confirmedCleaner,
        );
        const applicantPromises = filteredIds.map(async uid => {
          const userDoc = await firestore().collection('Users').doc(uid).get();
          if (userDoc.exists) {
            return {uid: userDoc.id, ...userDoc.data()} as CleanerData;
          }
          return null;
        });
        const results = await Promise.all(applicantPromises);
        setApplicants(results.filter(Boolean) as CleanerData[]);
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      fetchJobData();
    }, [fetchJobData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobData().finally(() => setRefreshing(false));
  };

  // Send notification helper
  const sendNotification = async (
    fcmToken: string,
    title: string,
    body: string,
    screen: string,
  ) => {
    try {
      await fetch(`${SERVER_URL}/api/send-notification`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fcmToken, title, body, data: {screen}}),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Store notification in Firestore
  const storeNotification = async (
    type: string,
    fromUserId: string,
    toUserId: string,
    title: string,
    body: string,
    jobIdVal: string,
    jobTitleVal: string,
  ) => {
    try {
      await firestore().collection('Notifications').add({
        type,
        fromUserId,
        toUserId,
        jobId: jobIdVal,
        title,
        body,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        jobTitle: jobTitleVal,
      });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  };

  // Confirm a cleaner
  const handleConfirmCleaner = async (cleaner: CleanerData) => {
    const user = auth().currentUser;
    if (!user) return;

    setConfirmModal({
      visible: true,
      title: 'Confirm Cleaner',
      subTitle: `Once you confirm ${cleaner.name}, your job listing will no longer be visible to other cleaners. Are you sure you want to proceed?`,
      iconName: 'account-check',
      iconColor: Colors.success,
      buttonTitle: 'Confirm',
      onConfirm: async () => {
        setConfirmModal(prev => ({...prev, visible: false}));
        setActionLoading(cleaner.uid);
        try {
          await firestore().collection('Jobs').doc(jobId).update({
            confirmedCleaner: cleaner.uid,
            status: 'confirmed',
          });

          // Send notification to cleaner
          if (cleaner.fcmToken) {
            await sendNotification(
              cleaner.fcmToken,
              'Job Confirmed! 🎉',
              `You have been hired for "${jobTitle}"`,
              'notifications',
            );
          }

          // Store notification
          await storeNotification(
            'confirmation',
            user.uid,
            cleaner.uid,
            'Job Confirmed! 🎉',
            `You have been hired for "${jobTitle}"`,
            jobId,
            jobTitle,
          );

          showToast({
            type: 'success',
            title: 'Cleaner Confirmed',
            message: `${cleaner.name} has been hired for this job`,
          });

          fetchJobData();
        } catch (error) {
          console.error('Error confirming cleaner:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to confirm cleaner',
          });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Cancel a confirmed cleaner
  const handleCancelCleaner = async () => {
    const user = auth().currentUser;
    if (!user || !confirmedCleaner) return;

    setConfirmModal({
      visible: true,
      title: 'Cancel Cleaner',
      subTitle: `If you cancel ${confirmedCleaner.name}, your job will become active again. Other cleaners will be able to apply, and previously applied cleaners will still be visible in the applicants list — you can confirm any of them. Are you sure?`,
      iconName: 'account-remove',
      iconColor: Colors.red500,
      buttonTitle: 'Yes',
      onConfirm: async () => {
        setConfirmModal(prev => ({...prev, visible: false}));
        setActionLoading('cancel');
        try {
          await firestore().collection('Jobs').doc(jobId).update({
            confirmedCleaner: null,
            status: 'active',
            cancelledCleaners: firestore.FieldValue.arrayUnion(
              confirmedCleaner.uid,
            ),
          });

          // Send notification to cleaner
          if (confirmedCleaner.fcmToken) {
            await sendNotification(
              confirmedCleaner.fcmToken,
              'Job Cancelled',
              `Your assignment for "${jobTitle}" has been cancelled`,
              'notifications',
            );
          }

          // Store notification
          await storeNotification(
            'cancellation',
            user.uid,
            confirmedCleaner.uid,
            'Job Cancelled',
            `Your assignment for "${jobTitle}" has been cancelled`,
            jobId,
            jobTitle,
          );

          showToast({
            type: 'success',
            title: 'Cleaner Removed',
            message: 'The cleaner has been removed from this job',
          });

          fetchJobData();
        } catch (error) {
          console.error('Error cancelling cleaner:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to cancel cleaner',
          });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Navigate to cleaner profile
  const handleViewProfile = (cleanerId: string) => {
    navigation.navigate('CleanerProfile', {
      cleanerId,
      jobId,
    });
  };

  // Find existing chat between two users
  const fetchExistingChatId = async (userId1: string, userId2: string) => {
    try {
      const chatsSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId1)
        .get();
      for (const doc of chatsSnapshot.docs) {
        const participants = doc.data().participants || [];
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

  // Navigate to chat with cleaner
  const handleMessageCleaner = async (cleaner: CleanerData) => {
    const user = auth().currentUser;
    if (!user) return;

    const userData = (
      await firestore().collection('Users').doc(user.uid).get()
    ).data();

    const existingChatId = await fetchExistingChatId(user.uid, cleaner.uid);
    const chatId = existingChatId || `${user.uid}_${cleaner.uid}`;

    navigation.navigate('Chat', {
      chatId,
      senderId: user.uid,
      senderName: userData?.name || '',
      receiver: cleaner.uid,
      receiverName: cleaner.name,
      receiverProfile: cleaner.profile || '',
      senderProfile: userData?.profile || '',
      fcmToken: cleaner.fcmToken || '',
    });
  };

  const renderCleanerCard = ({
    item,
    isConfirmed,
    isWithdrawn,
    isSelfCancelled,
  }: {
    item: CleanerData;
    isConfirmed: boolean;
    isWithdrawn?: boolean;
    isSelfCancelled?: boolean;
  }) => (
    <View style={styles.cleanerCard}>
      <View style={styles.cleanerInfo}>
        <Image
          source={item.profile ? {uri: item.profile} : IMAGES.defaultPic}
          style={styles.cleanerAvatar}
        />
        <View style={styles.cleanerDetails}>
          <Text style={styles.cleanerName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cleanerEmail} numberOfLines={1}>
            {item.email}
          </Text>
          {isWithdrawn && (
            <View style={styles.cancelledBeforeBadge}>
              <MaterialCommunityIcons
                name="account-cancel"
                size={RFPercentage(1.5)}
                color={isSelfCancelled ? Colors.red500 : Colors.orange500}
              />
              <Text style={[styles.cancelledBeforeBadgeText, !isSelfCancelled && {color: Colors.orange500}]}>
                {isSelfCancelled ? 'Cleaner left this job before' : 'You had cancelled this cleaner before'}
              </Text>
            </View>
          )}
        </View>
        {isConfirmed && (
          <View style={styles.tagsContainer}>
            <View style={styles.confirmedBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={RFPercentage(1.5)}
                color={Colors.success}
              />
              <Text style={styles.confirmedBadgeText}>Confirmed</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewProfileBtn}
          activeOpacity={0.7}
          onPress={() => handleViewProfile(item.uid)}>
          <MaterialCommunityIcons
            name="account-eye"
            size={RFPercentage(2)}
            color={Colors.gradient1}
          />
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.messageBtn}
          activeOpacity={0.7}
          onPress={() => handleMessageCleaner(item)}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={RFPercentage(2)}
            color={Colors.primaryBlue}
          />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>

        {isConfirmed ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={handleCancelCleaner}
            disabled={actionLoading === 'cancel'}>
            {actionLoading === 'cancel' ? (
              <ActivityIndicator size="small" color={Colors.red500} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={RFPercentage(2)}
                  color={Colors.red500}
                />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.7}
            onPress={() => handleConfirmCleaner(item)}
            disabled={actionLoading === item.uid}>
            {actionLoading === item.uid ? (
              <ActivityIndicator size="small" color={Colors.success} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={RFPercentage(2)}
                  color={Colors.success}
                />
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Management</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {/* Job Title Bar */}
      <View style={styles.jobTitleBar}>
        <MaterialCommunityIcons
          name="briefcase-outline"
          size={RFPercentage(2.2)}
          color={Colors.gradient1}
        />
        <Text style={styles.jobTitleText} numberOfLines={2}>
          {jobTitle}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {confirmedCleaner ? (
                /* ── Confirmed Cleaner Section (shown when a cleaner is hired) ── */
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="account-check"
                      size={RFPercentage(2.2)}
                      color={Colors.success}
                    />
                    <Text style={styles.sectionTitle}>Confirmed Cleaner</Text>
                  </View>
                  {renderCleanerCard({
                    item: confirmedCleaner,
                    isConfirmed: true,
                    isWithdrawn: cancelledCleaners.includes(confirmedCleaner.uid) || selfCancelledCleaners.includes(confirmedCleaner.uid),
                    isSelfCancelled: selfCancelledCleaners.includes(confirmedCleaner.uid),
                  })}
                </View>
              ) : (
                /* ── Applicants Section (shown when no cleaner is confirmed yet) ── */
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={RFPercentage(2.2)}
                      color={Colors.gradient1}
                    />
                    <Text style={styles.sectionTitle}>
                      Applicants ({applicants.length})
                    </Text>
                  </View>
                  {applicants.length === 0 ? (
                    <View style={styles.emptySection}>
                      <MaterialCommunityIcons
                        name="account-off-outline"
                        size={RFPercentage(4)}
                        color={Colors.secondaryText}
                      />
                      <Text style={styles.emptySectionText}>
                        No applicants yet
                      </Text>
                    </View>
                  ) : (
                    applicants.map(applicant => (
                      <View key={applicant.uid}>
                        {renderCleanerCard({
                          item: applicant,
                          isConfirmed: false,
                          isWithdrawn: cancelledCleaners.includes(applicant.uid) || selfCancelledCleaners.includes(applicant.uid),
                          isSelfCancelled: selfCancelledCleaners.includes(applicant.uid),
                        })}
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gradient1}
            />
          }
        />
      )}

      {/* Confirm / Cancel Modal */}
      {confirmModal.visible && (
        <TouchableWithoutFeedback
          onPress={() =>
            setConfirmModal(prev => ({...prev, visible: false}))
          }>
          <View style={styles.modalOverlay}>
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal
              title={confirmModal.title}
              subTitle={confirmModal.subTitle}
              iconName={confirmModal.iconName}
              iconColor={confirmModal.iconColor}
              buttonTitle={confirmModal.buttonTitle}
              cancelButtonTitle="No"
              onPress={() => setConfirmModal(prev => ({...prev, visible: false}))}
              onPress2={confirmModal.onConfirm}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default JobManagement;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalOverlay: {
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
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
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
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  jobTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.2),
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(1),
    gap: RFPercentage(0.8),
  },
  jobTitleText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gradient1,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(10),
  },
  sectionContainer: {
    marginTop: RFPercentage(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1),
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.primaryText,
  },
  cleanerCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  cleanerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(1.5),
  },
  cleanerAvatar: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(3.5),
    borderWidth: 2,
    borderColor: Colors.gradient1,
    marginRight: RFPercentage(1.4),
  },
  cleanerDetails: {
    flex: 1,
  },
  cleanerName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
    color: Colors.primaryText,
  },
  cleanerEmail: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.3),
  },
  tagsContainer: {
    alignItems: 'flex-end',
    gap: RFPercentage(0.5),
    justifyContent: 'flex-start',
    marginTop: -RFPercentage(1.5),
    marginRight: -RFPercentage(1),
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: RFPercentage(0.9),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(0.6),
    gap: RFPercentage(0.3),
  },
  confirmedBadgeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.success,
  },
  cancelledBeforeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
    marginTop: RFPercentage(0.3),
  },
  cancelledBeforeBadgeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.red500,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: RFPercentage(0.8),
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.skyBlueBg,
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
  },
  viewProfileText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gradient1,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0fe',
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
  },
  messageBtnText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryBlue,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successBg,
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
  },
  confirmBtnText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.success,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redBg100,
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
  },
  cancelBtnText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.red500,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: RFPercentage(3),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  emptySectionText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.8),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
});
