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

const Settings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [role, setuserRole] = useState('');
  const [loading, setLoading] = useState(false);

  const logOut = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      await AsyncStorage.setItem('logout', 'yes');
      navigation.navigate('SignIn');
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Log Out',
        text2: 'Logged out successfully',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });
    } catch (error) {
      console.log('Logout Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const userRole = async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setuserRole(userData?.role);
      } else {
        console.log('User data not found.');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  userRole();

  const deleteAccount = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      await firestore().collection('Users').doc(user.uid).delete();

      await user.delete();

      await AsyncStorage.multiRemove(['email', 'password', 'role']);

      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been permanently deleted.',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });
      navigation.navigate('UserSelection');
      setModalVisible2(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete account. Please try again.',
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
