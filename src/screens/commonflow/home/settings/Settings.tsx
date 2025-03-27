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
  const [role, setuserRole] = useState('');

  const logOut = async () => {
    try {
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      navigation.navigate('SignIn');
      setModalVisible(false);

      Toast.show({
        type: 'success',
        text1: 'Log Out',
        text2: 'Logged out successfully',
        position: 'top',
        text1Style: {fontFamily: Fonts.fontBold},
        text2Style: {fontFamily: Fonts.fontRegular},
      });
    } catch (error) {
      console.log('Logout Error:', error);
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
    fontSize: RFPercentage(1.8),
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
    fontSize: RFPercentage(1.6),
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
