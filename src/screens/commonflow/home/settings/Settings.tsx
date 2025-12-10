import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ProfileField from '../../../../components/ProfileField';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../../components/CustomModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../../utils/ToastMessage';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import firestore, {deleteField} from '@react-native-firebase/firestore';
import {EmailAuthProvider} from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const Settings = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [role, setuserRole] = useState('');
  const [loading, setLoading] = useState(false);
  useExitAppOnBack();

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
        setuserRole(userData?.role);
      }
    } catch (error) {}
  };
  userRole();

  const deleteAccount = async () => {
    console.log('🧹 [deleteAccount] Started');
    setLoading(true);
    try {
      const user = auth().currentUser;
      console.log('👤 Current user:', user ? user.uid : 'No user found');
      if (!user) {
        console.log('❌ No user, aborting delete process');
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const email = user.email;
      console.log('email.......', email);
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
        console.log('🧾 Committing job deletions...');
        await jobBatch.commit();
        console.log('✅ Jobs deleted');
      } else {
        console.log('ℹ️ No jobs to delete');
      }

      // Delete Chats data
      console.log('💬 Fetching related Chats...');
      const chatSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId)
        .get();
      console.log('📄 Chats found:', chatSnapshot.size);

      const chatBatch = firestore().batch();
      chatSnapshot.forEach(doc => chatBatch.delete(doc.ref));
      if (chatSnapshot.size > 0) {
        console.log('🧾 Committing chat deletions...');
        await chatBatch.commit();
        console.log('✅ Chats deleted');
      } else {
        console.log('ℹ️ No chats to delete');
      }

      // Delete CleanerServices doc (if exists)
      console.log('🧹 Deleting CleanerServices doc...');
      await firestore()
        .collection('CleanerServices')
        .doc(userId)
        .delete()
        .catch(e => {
          console.log('⚠️ CleanerServices delete error (ignored):', e.message);
        });
      console.log('✅ CleanerServices doc deleted or not found');

      // Delete Firebase user
      console.log('🧨 Deleting Firebase Auth user...');
      await user.delete();
      console.log('✅ Firebase user deleted');

      // Clear AsyncStorage
      console.log('🗑️ Clearing AsyncStorage...');
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      console.log('✅ AsyncStorage cleared');

      // Show success toast
      showToast({
        type: 'success',
        title: 'Account Deleted',
        message:
          'Your account and all associated data have been permanently removed.',
      });
      console.log('🎉 Account deletion completed successfully');

      setModalVisible2(false);

      setTimeout(() => {
        console.log('🔄 Navigating to OnBoarding...');
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
      console.log('🕓 [deleteAccount] Finished');
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Settings"
          textStyle={styles.headerText}
          left={true}
          arrowColor="#FFFFFF"
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={'white'}
        />
      </LinearGradient>
      <View style={styles.container}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Help & Security</Text>
        </View>
        <View style={styles.profileFieldsContainer}>
          {role === 'Cleaner' && (
            <ProfileField
              text="Cancel Subscription"
              icon={Icons.policy}
              onPress={() => navigation.navigate('CancelSubscription')}
            />
          )}
          <ProfileField
            text="Change Password"
            icon={Icons.policy}
            onPress={() => navigation.navigate('ChangePasswordV2')}
          />
          <ProfileField
            text="Privacy Policy"
            icon={Icons.policy}
            onPress={() => navigation.navigate('Privacy')}
          />
          <ProfileField
            text="Terms & Conditions"
            icon={Icons.terms}
            onPress={() => navigation.navigate('Terms')}
          />
          <ProfileField
            text={`FAQ's`}
            icon={Icons.faqs}
            onPress={() => navigation.navigate('FAQS')}
          />
          <ProfileField
            text="Delete Account"
            icon={Icons.remove}
            color={'rgba(239, 68, 68, 1)'}
            onPress={() => setModalVisible2(true)}
          />
          <ProfileField
            text="Logout"
            icon={Icons.logOut}
            color={'rgba(239, 68, 68, 1)'}
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>

      {/* Logout Modal */}
      {modalVisible && (
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title="Logout Confirmation"
              subTitle="Are you sure you want to log out from your account?"
              onPress={() => setModalVisible(false)}
              onPress2={logOut}
              loader={loading}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Delete Account Modal */}
      {modalVisible2 && (
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title="Permanently Delete Account"
              subTitle="Deleting your account will permanently remove your profile and all associated data from our system. This action cannot be undone. Do you want to continue?"
              onPress={() => setModalVisible2(false)}
              onPress2={deleteAccount}
              loader={loading}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(1),
  },
  sectionTitle: {
    marginTop: RFPercentage(2),
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: 5,
    width: RFPercentage(30),
  },
  sectionTitleText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
  },
  profileFieldsContainer: {
    marginTop: RFPercentage(1),
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  infoNote: {
    color: Colors.grey,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginTop: RFPercentage(2),
  },
});
