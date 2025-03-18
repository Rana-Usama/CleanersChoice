import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Colors, Icons, Fonts} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import PasswordField from '../../../components/PasswordField';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CustomModal from '../../../components/CustomModal';

const ChangePasswordV2 = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ChangePasswordV2'>
    >();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <HeaderBack
          title={`Change Password`}
          textStyle={{fontSize: RFPercentage(1.8)}}
        />
        <View style={styles.container}>
          <View style={{marginTop: RFPercentage(4)}}>
            <Text style={styles.label}>Old Password</Text>
            <PasswordField
              placeholder="Enter old password"
              value={oldPassword}
              onChangeText={setOldPassword}
              customStyle={{width: '100%'}}
            />
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <Text style={styles.label}>New Password</Text>
            <PasswordField
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              customStyle={{width: '100%'}}
            />
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <Text style={styles.label}>Repeat New Password</Text>
            <PasswordField
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              customStyle={{width: '100%'}}
            />
          </View>

          <View style={{marginTop: RFPercentage(20), alignSelf: 'center'}}>
            <GradientButton
              title="Change"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </View>
      </ScrollView>
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{position: 'absolute', width: '100%', height: '100%'}}>
            <BlurView
              style={{width: '100%', height: '100%', position: 'absolute'}}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal passwordModal={true} title={'Your password hase been successfuly changed'} onPress3={()=> setModalVisible(false)} />
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

export default ChangePasswordV2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  label: {
    color: Colors.brown,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
