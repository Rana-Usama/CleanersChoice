import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../../constants/Themes';
import ProfileField from '../../../../components/ProfileField';
import CustomModal from '../../../../components/CustomModal';
import ModalWrapper from '../../../../components/ModalWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../../utils/ToastMessage';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import firestore, {deleteField} from '@react-native-firebase/firestore';
import {EmailAuthProvider} from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import DeviceInfo from 'react-native-device-info';
import moment from 'moment';

const Settings = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [role, setuserRole] = useState('');
  const [loading, setLoading] = useState(false);
  useExitAppOnBack();
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [subscription, setSubscription] = useState(false);
  const [cancelSubscription, setCancelSubscription] = useState(false);

  const [appVersion, setAppVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');

  useEffect(() => {
    setAppVersion(DeviceInfo.getVersion());
    setBuildNumber(DeviceInfo.getBuildNumber());
  }, []);

  // Log out function
  const logOut = async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('Users').doc(currentUser.uid).update({
          fcmToken: deleteField(),
        });
      }
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      await AsyncStorage.setItem('logout', 'yes');
      showToast({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
      });
      setModalVisible(false);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'SignIn'}],
        });
      }, 300);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Get user role
  const userRole = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User data fetched for role and subscription:', userData);
        setSubscriptionId(userData?.subscriptionId);
        setuserRole(userData?.role);
        setSubscription(userData?.subscription ?? false);
        setCancelSubscription(userData?.cancelSubscription ?? false);
      }
    } catch (error) {}
  };

  useEffect(() => {
    userRole();
  }, []);

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const email = user.email;
      const password = await AsyncStorage.getItem('password');
      if (!password) {
        showToast({
          type: 'error',
          title: 'Missing Password',
          message: 'Please log in again before deleting your account.',
        });
        setLoading(false);
        return;
      }
      const credential = EmailAuthProvider.credential(email, password);
      await user.reauthenticateWithCredential(credential);
      await firestore().collection('Users').doc(userId).delete();

      const jobsSnapshot = await firestore()
        .collection('Jobs')
        .where('jobId', '==', userId)
        .get();

      const jobBatch = firestore().batch();
      jobsSnapshot.forEach(doc => jobBatch.delete(doc.ref));
      if (jobsSnapshot.size > 0) {
        await jobBatch.commit();
      } else {
        console.log(' No jobs to delete');
      }

      // Delete Chats data
      const chatSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId)
        .get();

      const chatBatch = firestore().batch();
      chatSnapshot.forEach(doc => chatBatch.delete(doc.ref));
      if (chatSnapshot.size > 0) {
        await chatBatch.commit();
      } else {
        console.log(' No chats to delete');
      }

      // Delete CleanerServices doc (if exists)
      await firestore()
        .collection('CleanerServices')
        .doc(userId)
        .delete()
        .catch(e => {
          console.log(' CleanerServices delete error (ignored):', e.message);
        });
      // Delete Firebase user
      await user.delete();
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      if (subscriptionId) {
        await fetch(
          'https://cleaners-choice-server.vercel.app/api/cancel-subscription',
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({subscriptionId}),
          },
        );
      }

      // Show success toast
      showToast({
        type: 'success',
        title: 'Account Deleted',
        message:
          'Your account and all associated data have been permanently removed.',
      });
      setModalVisible2(false);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'OnBoarding'}],
        });
      }, 1000);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        showToast({
          type: 'error',
          title: 'Re-authentication Required',
          message: 'Please log in again before deleting your account.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Edit Profile Section — Cleaner only */}
          {role === 'Cleaner' && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="account-edit"
                  size={RFPercentage(2.5)}
                  color={Colors.gradient1}
                />
                <Text style={styles.sectionTitle}>Profile</Text>
              </View>
              <View style={styles.fieldsContainer}>
                <ProfileField
                  text="Edit Profile"
                  icon="account-edit-outline"
                  onPress={() => navigation.navigate('EditProfile')}
                />
              </View>
            </View>
          )}

          {/* Help & Security Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="shield-account"
                size={RFPercentage(2.5)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Help & Security</Text>
            </View>

            <View style={styles.fieldsContainer}>
              {role === 'Cleaner' && (
                <ProfileField
                  text="Cancel Subscription"
                  icon="credit-card-remove"
                  onPress={() => navigation.navigate('CancelSubscription')}
                />
              )}
              <ProfileField
                text="Change Password"
                icon="lock-reset"
                onPress={() => navigation.navigate('ChangePasswordV2')}
              />
              <ProfileField
                text="Privacy Policy"
                icon="shield-lock"
                onPress={() => navigation.navigate('Privacy')}
              />
              <ProfileField
                text="Terms & Conditions"
                icon="file-document"
                onPress={() => navigation.navigate('Terms')}
              />
              <ProfileField
                text="FAQs"
                icon="help-circle"
                onPress={() => navigation.navigate('FAQS')}
              />
            </View>
          </View>

          {/* Account Actions Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-cog"
                size={RFPercentage(2.5)}
                color={Colors.primaryText}
              />
              <Text style={styles.sectionTitle}>Account Actions</Text>
            </View>

            <View style={styles.fieldsContainer}>
              <ProfileField
                text="Delete Account"
                icon="account-remove"
                color={Colors.red500}
                onPress={() => {
                  if (
                    Platform.OS === 'ios' &&
                    subscription === true &&
                    cancelSubscription === false
                  ) {
                    setModalVisible3(true);
                    return;
                  }
                  setModalVisible2(true);
                }}
              />
              <ProfileField
                text="Logout"
                icon="earth-remove"
                color={Colors.red500}
                onPress={() => setModalVisible(true)}
              />
            </View>
          </View>

          {/* App Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Feather name="info" size={18} color={Colors.secondaryText} />
              <Text style={styles.infoTitle}>App Information</Text>
            </View>
            <Text style={styles.infoText}>
              Version {appVersion} © {moment().format('YYYY')} Cleaner Choice
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <ModalWrapper visible={modalVisible} blurAmount={10}>
        <CustomModal
          title="Logout"
          subTitle="Are you sure you want to log out from your account?"
          onPress={() => setModalVisible(false)}
          onPress2={logOut}
          loader={loading}
          buttonTitle="Logout"
        />
      </ModalWrapper>

      {/* Active Subscription Modal (iOS) */}
      <ModalWrapper visible={modalVisible3} blurAmount={10}>
        <CustomModal
          title="Subscription Active"
          subTitle="You currently have an active subscription. Please cancel your subscription first before deleting your account."
          iconName="alert-circle-outline"
          iconColor={Colors.red500}
          onPress={() => setModalVisible3(false)}
          onPress2={() => {
            setModalVisible3(false);
            Linking.openURL('https://apps.apple.com/account/subscriptions');
          }}
          buttonTitle="Manage Plan"
        />
      </ModalWrapper>

      {/* Delete Account Modal */}
      <ModalWrapper visible={modalVisible2} blurAmount={10}>
        <CustomModal
          title="Delete Account"
          subTitle="Are you sure you want to permanently delete your account?"
          onPress={() => setModalVisible2(false)}
          onPress2={deleteAccount}
          loader={loading}
          buttonTitle="Delete"
        />
      </ModalWrapper>
    </View>
  );
};

export default Settings;

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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(20),
  },
  container: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    overflow: 'hidden',
    borderBottomWidth: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFPercentage(2),
    backgroundColor: Colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBg,
    gap: RFPercentage(1),
  },
  sectionTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
  },
  fieldsContainer: {
    paddingVertical: RFPercentage(0.5),
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: RFPercentage(2),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginTop: RFPercentage(1),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.5),
    gap: RFPercentage(0.8),
  },
  infoTitle: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  infoText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
  },
});