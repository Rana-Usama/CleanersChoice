import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
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
import firestore from '@react-native-firebase/firestore';
import {showToast} from '../../../../utils/ToastMessage';
import {useExitAppOnBack} from '../../../../utils/ExitApp';

const Settings = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [role, setuserRole] = useState('');
  const [loading, setLoading] = useState(false);
  useExitAppOnBack();

  // Log out function
  const logOut = async () => {
    setModalVisible(false);
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('Users').doc(currentUser.uid).update({
          fcmToken: firestore.FieldValue.delete(),
        });
      }
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      await AsyncStorage.setItem('logout', 'yes');
      showToast({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
      });
      navigation.reset({
        index: 0,
        routes: [{name: 'SignIn'}],
      });
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

  // Delete Account function
  const deleteAccount = async () => {
    setLoading(true);
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const userId = user.uid;
    const email = user.email;
    setModalVisible2(false);
    try {
      const password = await AsyncStorage.getItem('password');
      const credential = auth.EmailAuthProvider.credential(email, password);
      await user.reauthenticateWithCredential(credential);
      // Delete all user-related data
      await firestore().collection('Users').doc(userId).delete();

      const querySnapshot = await firestore()
        .collection('Jobs')
        .where('jobId', '==', userId)
        .get();
      const batch = firestore().batch();
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      const chatSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId)
        .get();
      const chatBatch = firestore().batch();
      chatSnapshot.forEach(doc => chatBatch.delete(doc.ref));
      await chatBatch.commit();

      await firestore().collection('CleanerServices').doc(userId).delete();
      await user.delete();

      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      showToast({
        type: 'success',
        title: 'Account Deleted',
        message:
          'Your account and all associated data have been permanently removed.',
      });

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'OnBoarding'}],
        });
      }, 1000);
    } catch (error: any) {
      showToast({
        type: 'danger',
        title: 'Delete Failed',
        message:
          error?.message || 'Something went wrong while deleting your account.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title={'Settings'} textStyle={styles.headerText} logo />
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
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
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
        <TouchableWithoutFeedback onPress={() => setModalVisible2(false)}>
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
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerText: {
    fontSize: RFPercentage(2),
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
