import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import NextButton from '../../components/NextButton';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import {RadioButton, RadioButtonInput} from 'react-native-simple-radio-button';
import HeaderComponent from '../../components/HeaderComponent';
import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import GradientButton from '../../components/GradientButton';

const {width, height} = Dimensions.get('window');

const SignIn: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignIn'>>();
  const [selected, setSelected] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <View style={styles.container}>
          <HeaderComponent />
          <View
            style={{
              alignSelf: 'center',
              marginVertical: RFPercentage(2),
              width: '90%',
            }}>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(2),
                textAlign: 'center',
                marginTop: RFPercentage(1),
              }}>
              Welcome Back
            </Text>
          </View>

          <View
            style={{
              alignSelf: 'center',
              marginTop: RFPercentage(1.8),
              width: '95%',
              alignItems: 'center',
            }}>
            <InputField placeholder="Username" />
            <PasswordField placeholder="Password" />
          </View>
          <View style={styles.radioContainer}>
            <View
              style={{
                width: '90%',
                alignItems: 'center',
                justifyContent: 'flex-start',
                flexDirection: 'row',
              }}>
              <View style={styles.radioButtonRow}>
                <RadioButton>
                  <RadioButtonInput
                    obj={{value: 0}}
                    index={0}
                    isSelected={selected}
                    onPress={() => setSelected(!selected)}
                    borderWidth={1}
                    buttonInnerColor={Colors.gradient1}
                    buttonOuterColor={
                      selected ? Colors.gradient1 : 'rgba(229, 231, 235, 1)'
                    }
                    buttonSize={8}
                    buttonOuterSize={14}
                  />
                </RadioButton>
                <Text style={styles.radioLabel}>Remember me?</Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                style={{position: 'absolute', right: 0}}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              alignSelf: 'center',
              marginTop: RFPercentage(5),
              width: '90%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <GradientButton
              title="Sign In"
              onPress={()=>navigation.navigate('Home')}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: RFPercentage(3.5),
              }}>
              <Text
                style={{
                  color: Colors.secondaryText,
                  fontSize: RFPercentage(1.4),
                  fontFamily: Fonts.fontRegular,
                }}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text
                  style={{
                    color: Colors.gradient1,
                    fontSize: RFPercentage(1.4),
                    fontFamily: Fonts.fontRegular,
                    left: 3,
                  }}>
                  Signup
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          
        </View>
        <View style={{position: 'absolute',bottom:RFPercentage(6), right: RFPercentage(1.5),}}>
            <Image
              source={IMAGES.stars}
              resizeMode="contain"
              style={{
                width: RFPercentage(8),
                height: RFPercentage(8),
              }}
            />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    // flex: 1,
    backgroundColor: Colors.background,
    // paddingTop: height * 0.02,
  },
  pictureContainer: {
    width: RFPercentage(14),
    height: RFPercentage(14),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 1,
    borderColor: 'rgba(64, 123, 255, 1)',
    // shadowColor: 'red',
    // shadowOffset: { width: 40, height: 40 },
    // shadowOpacity: 0,
    // shadowRadius: 0,
    // elevation: 8,
  },
  radioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(0.1),
    width: '95%',
    alignSelf: 'center',
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: RFPercentage(1.4),
    color: Colors.primaryText,
    marginLeft: 6,
    fontFamily: Fonts.fontRegular,
    bottom: 1,
  },
  forgotPassword: {
    fontSize: RFPercentage(1.4),
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    bottom: 1.5,
  },
});
