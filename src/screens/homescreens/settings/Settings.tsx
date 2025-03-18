import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import ProfileField from '../../../components/ProfileField';
import {useNavigation} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import CustomModal from '../../../components/CustomModal';

const Settings = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title={'Settings'}
        textStyle={{fontSize: RFPercentage(1.8)}}
      />
      <View style={styles.container}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Help & Security</Text>
        </View>
        <View style={{marginTop: RFPercentage(1)}}>
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
          <View style={{position: 'absolute', width: '100%', height: '100%'}}>
            <BlurView
              style={{width: '100%', height: '100%', position: 'absolute'}}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal
              title={'Are you sure you want to Logout?'}
              onPress={() => setModalVisible(false)}
              onPress2={() => setModalVisible(false)}
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
});
