import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES, Icons} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import GradientButton from '../../../../components/GradientButton';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {showToast} from '../../../../utils/ToastMessage';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../../components/CustomModal';

const SERVER_URL = 'https://cleaners-choice-server.vercel.app';

const CleanerProfile = ({route, navigation}: any) => {
  const {cleanerId, jobId} = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [isAlreadyConfirmed, setIsAlreadyConfirmed] = useState(false);
  const [isApplicant, setIsApplicant] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch cleaner profile
      const userDoc = await firestore()
        .collection('Users')
        .doc(cleanerId)
        .get();
      if (userDoc.exists) {
        setProfile(userDoc.data());
      }

      // Fetch cleaner service data
      const serviceDoc = await firestore()
        .collection('CleanerServices')
        .doc(cleanerId)
        .get();
      if (serviceDoc.exists) {
        setServiceData(serviceDoc.data());
      }

      // Fetch job data if jobId provided
      if (jobId) {
        const jobDoc = await firestore().collection('Jobs').doc(jobId).get();
        if (jobDoc.exists) {
          const job = jobDoc.data();
          setJobData(job);
          setIsAlreadyConfirmed(job?.confirmedCleaner === cleanerId);
          setIsApplicant(
            (job?.applicants || []).includes(cleanerId),
          );
        }
      }
    } catch (error) {
      console.error('Error fetching cleaner data:', error);
    } finally {
      setLoading(false);
    }
  }, [cleanerId, jobId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleConfirm = () => {
    setShowConfirmModal(true);
  };

  const doConfirm = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setShowConfirmModal(false);
    setConfirmLoading(true);
    try {
      await firestore().collection('Jobs').doc(jobId).update({
        confirmedCleaner: cleanerId,
        status: 'confirmed',
      });

      // Send notification to cleaner
      if (profile?.fcmToken) {
        try {
          await fetch(`${SERVER_URL}/api/send-notification`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              fcmToken: profile.fcmToken,
              title: 'Job Confirmed! 🎉',
              body: `You have been hired for "${jobData?.title}"`,
              data: {screen: 'notifications'},
            }),
          });
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }

      // Store notification
      try {
        await firestore().collection('Notifications').add({
          type: 'confirmation',
          fromUserId: user.uid,
          toUserId: cleanerId,
          jobId,
          title: 'Job Confirmed! 🎉',
          body: `You have been hired for "${jobData?.title}"`,
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false,
          jobTitle: jobData?.title,
        });
      } catch (err) {
        console.error('Error storing notification:', err);
      }

      showToast({
        type: 'success',
        title: 'Cleaner Confirmed',
        message: `${profile?.name} has been hired`,
      });

      setIsAlreadyConfirmed(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error('Error confirming cleaner:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to confirm cleaner',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const serviceTypes: Record<string, string> = {
    '11': 'Residential Cleaning',
    '22': 'Car Cleaning',
    '33': 'Window Cleaning',
    '44': 'Pressure Washing',
    '55': 'Carpet Cleaning',
    '66': 'Chimney Cleaning',
    '77': 'Lawn Care',
    '88': 'Others',
  };

  if (loading) {
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
            <Text style={styles.headerTitle}>Cleaner Profile</Text>
            <View style={{width: 40}} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Cleaner Profile</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  profile?.profile
                    ? {uri: profile.profile}
                    : IMAGES.defaultPic
                }
                resizeMode="cover"
                style={styles.avatar}
              />
              <Image
                source={Icons.owner}
                resizeMode="contain"
                style={styles.ownerBadge}
              />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {profile?.name || 'Cleaner'}
            </Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name="sparkles"
                size={RFPercentage(1.8)}
                color={Colors.gradient1}
              />
              <Text style={styles.roleText}>Professional Cleaner</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="email-outline"
              size={RFPercentage(2)}
              color={Colors.gradient1}
            />
            <Text style={styles.infoText}>
              {profile?.email || 'Not provided'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={RFPercentage(2)}
              color={Colors.gradient1}
            />
            <Text style={styles.infoText}>
              {profile?.phone || 'Not provided'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {serviceData?.description && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.descriptionText}>
              {serviceData.description}
            </Text>
          </View>
        )}

        {/* Services */}
        {serviceData?.type && serviceData.type.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Services Offered</Text>
            <View style={styles.servicesGrid}>
              {serviceData.type.map((typeId: string, index: number) => (
                <View key={index} style={styles.serviceChip}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={RFPercentage(1.5)}
                    color={Colors.success}
                  />
                  <Text style={styles.serviceChipText}>
                    {serviceTypes[typeId] || typeId}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Location */}
        {serviceData?.location?.name && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.infoRow}>
              <Ionicons
                name="location"
                size={RFPercentage(2)}
                color={Colors.red500}
              />
              <Text style={styles.infoText}>{serviceData.location.name}</Text>
            </View>
          </View>
        )}

        {/* Packages */}
        {serviceData?.packages && serviceData.packages.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Packages</Text>
            {serviceData.packages.map((pkg: any, index: number) => (
              <View key={index} style={styles.packageItem}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>
                    Package {index + 1}
                  </Text>
                  <Text style={styles.packagePrice}>${pkg.price}</Text>
                </View>
                <Text style={styles.packageDetails}>{pkg.details}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Gallery */}
        {serviceData?.serviceImages && serviceData.serviceImages.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}>
              {serviceData.serviceImages.map(
                (img: string, index: number) => (
                  <Image
                    key={index}
                    source={{uri: img}}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ),
              )}
            </ScrollView>
          </View>
        )}

        {/* Spacer for button */}
        <View style={{height: RFPercentage(12)}} />
      </ScrollView>

      {/* Confirm Button - only show when viewing from job context */}
      {jobId && !isAlreadyConfirmed && isApplicant && (
        <View style={styles.confirmBar}>
          <GradientButton
            title="Confirm Cleaner"
            onPress={handleConfirm}
            loading={confirmLoading}
            disabled={confirmLoading}
            style={styles.confirmButton}
            textStyle={styles.confirmButtonText}
          />
        </View>
      )}

      {jobId && isAlreadyConfirmed && (
        <View style={styles.confirmBar}>
          <View style={styles.confirmedState}>
            <MaterialCommunityIcons
              name="check-circle"
              size={RFPercentage(2.5)}
              color={Colors.success}
            />
            <Text style={styles.confirmedText}>Cleaner Confirmed</Text>
          </View>
        </View>
      )}

      {/* Confirm Cleaner Modal */}
      {showConfirmModal && (
        <TouchableWithoutFeedback onPress={() => setShowConfirmModal(false)}>
          <View style={styles.modalOverlay}>
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal
              title="Confirm Cleaner"
              subTitle={`Are you sure you want to hire ${profile?.name} for this job?`}
              iconName="account-check"
              iconColor={Colors.success}
              buttonTitle="Confirm"
              onPress3={() => setShowConfirmModal(false)}
              onPress={() => setShowConfirmModal(false)}
              onPress2={doConfirm}
              loader={confirmLoading}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default CleanerProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  scrollContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: RFPercentage(3),
    backgroundColor: 'white',
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(1),
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
  },
  avatarContainer: {
    marginBottom: RFPercentage(2),
  },
  imageWrapper: {
    position: 'relative',
  },
  avatar: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    borderWidth: RFPercentage(0.1),
    borderColor: Colors.gradient1,
  },
  ownerBadge: {
    position: 'absolute',
    width: RFPercentage(4),
    height: RFPercentage(4),
    right: -3,
    top: 0,
  },
  userInfo: {
    alignItems: 'center',
  },
  nameText: {
    color: Colors.blueGray700,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    marginBottom: RFPercentage(1),
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueOverlay90,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.5),
  },
  roleText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gradient1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginTop: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  cardTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
    marginBottom: RFPercentage(1),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    marginBottom: RFPercentage(0.8),
  },
  infoText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    flex: 1,
  },
  descriptionText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2.2),
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFPercentage(0.8),
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
  },
  serviceChipText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.success,
  },
  packageItem: {
    backgroundColor: Colors.inputBg,
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.2),
    marginBottom: RFPercentage(0.8),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(0.5),
  },
  packageName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  packagePrice: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.9),
    color: Colors.gradient1,
  },
  packageDetails: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  gallery: {
    marginTop: RFPercentage(0.5),
  },
  galleryImage: {
    width: RFPercentage(15),
    height: RFPercentage(12),
    borderRadius: RFPercentage(1),
    marginRight: RFPercentage(1),
  },
  confirmBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: RFPercentage(2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray200,
  },
  confirmButton: {
    width: '100%',
    borderRadius: 20,
  },
  confirmButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
  },
  confirmedState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successBg,
    padding: RFPercentage(1.8),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    gap: RFPercentage(1),
  },
  confirmedText: {
    color: Colors.successText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
