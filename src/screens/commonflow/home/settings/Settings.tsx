import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ProfileField from '../../../../components/ProfileField';
import {useNavigation} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../../components/CustomModal';
import {useSelector} from 'react-redux';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {showToast} from '../../../../utils/ToastMessage';

const Settings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [role, setuserRole] = useState('');
  const [loading, setLoading] = useState(false);

  // Log out
  const logOut = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      await AsyncStorage.setItem('logout', 'yes');
      setModalVisible(false);
      showToast({
        type: 'success',
        title: 'Log Out',
        message: 'Logged out successfully',
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

  // User Role
  const userRole = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setuserRole(userData?.role);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  userRole();

  // Delete Account

  const deleteAccount = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const email = await AsyncStorage.getItem('email');
      const password = await AsyncStorage.getItem('password');

      if (!email || !password) {
        throw new Error('Re-authentication failed. Please log in again.');
      }

      const credential = auth.EmailAuthProvider.credential(email, password);
      await user.reauthenticateWithCredential(credential);

      await firestore().collection('Users').doc(user.uid).delete();
      await user.delete();
      await AsyncStorage.multiRemove(['email', 'password', 'role']);

      showToast({
        type: 'success',
        title: 'Account Deleted',
        message: 'Your account has been permanently deleted.',
      });
      setModalVisible2(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'UserSelection'}],
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      showToast({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Account deletion failed.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title={'Settings'} textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Help & Security</Text>
        </View>
        <View style={styles.profileFieldsContainer}>
          {role === 'Cleaner' && (
            <>
              <ProfileField
                text="Cancel Subscription"
                icon={Icons.policy}
                onPress={() => navigation.navigate('CancelSubscription')}
              />
            </>
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
            text={`Account Deactivation`}
            icon={Icons.remove}
            onPress={() => setModalVisible2(true)}
          />
          <ProfileField
            text={`Logout`}
            icon={Icons.logOut}
            color={'rgba(239, 68, 68, 1)'}
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title={'Are you sure you want to Logout?'}
              onPress={() => setModalVisible(false)}
              onPress2={logOut}
              loader={loading}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {modalVisible2 && (
        <TouchableWithoutFeedback onPress={() => setModalVisible2(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title={'Are you sure you want to delete your account?'}
              onPress={() => setModalVisible2(false)}
              onPress2={deleteAccount}
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
});
