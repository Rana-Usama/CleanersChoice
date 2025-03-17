import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import Entypo from 'react-native-vector-icons/Entypo';
import HeaderBack from '../../components/HeaderBack';

const ResetPassword: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>
    >();

  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      navigation.navigate('Verify');
      setLoading(false);
    }, 2000);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}>
        <View style={styles.container}>
          <HeaderBack title={'Reset Password?'} />
          <View style={styles.inputContainer}>
            <InputField placeholder="Enter Email" />
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title="Send OTP"
              onPress={handleNext}
              loading={loading}
            />
          </View>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={styles.imageStyle}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flexContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background,
    marginTop: Platform.OS == 'android' ? RFPercentage(4) : RFPercentage(-0.8),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(3),
  },
  headerText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    textAlign: 'center',
  },
  inputContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    width: '95%',
    alignItems: 'center',
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    width: '95%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    bottom: RFPercentage(8),
    right: RFPercentage(1.5),
  },
  imageStyle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
