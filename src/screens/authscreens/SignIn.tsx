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
import {RadioButtonInput} from 'react-native-simple-radio-button';
import HeaderComponent from '../../components/HeaderComponent';
import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import GradientButton from '../../components/GradientButton';

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
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Welcome Back</Text>
          </View>

          <View style={styles.fieldContainer}>
            <InputField placeholder="Username" />
            <PasswordField placeholder="Password" />
          </View>
          <View style={styles.radioContainer}>
            <View style={styles.radioInner}>
              <View style={styles.radioButtonRow}>
                <RadioButtonInput
                  obj={{value: 0}}
                  index={0}
                  isSelected={selected}
                  onPress={() => setSelected(!selected)}
                  borderWidth={1}
                  buttonInnerColor={Colors.gradient1}
                  buttonOuterColor={
                    selected ? Colors.gradient1 : Colors.inputFieldColor
                  }
                  buttonSize={8}
                  buttonOuterSize={14}
                />
                <Text style={styles.radioLabel}>Remember me?</Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                style={{position: 'absolute', right: 0}}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title="Sign In"
              onPress={() => navigation.navigate('Home')}
            />
            <View style={styles.bottomContainer}>
              <Text style={styles.bottomText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUp}>Signup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.starContainer}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={styles.star}
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
    backgroundColor: Colors.background,
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
    justifyContent: 'center',
  },
  radioLabel: {
    fontSize: RFPercentage(1.4),
    color: Colors.primaryText,
    marginLeft: 6,
    fontFamily: Fonts.fontRegular,
  },
  forgotPassword: {
    fontSize: RFPercentage(1.4),
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    // bottom: 1.5,
  },
  headerContainer: {
    alignSelf: 'center',
    width: '90%',
    marginTop: RFPercentage(2.2),
  },
  heading: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
  fieldContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(2.9),
    width: '95%',
    alignItems: 'center',
  },
  radioInner: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(5),
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(3.5),
  },
  bottomText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  signUp: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    left: 3,
  },
  starContainer: {
    position: 'absolute',
    bottom: RFPercentage(6),
    right: RFPercentage(1.5),
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
