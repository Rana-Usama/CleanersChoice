import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSoftInputAdjustNothing} from '../../../hooks/useSoftInputMode';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import GradientButton from '../../../components/GradientButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {showToast} from '../../../utils/ToastMessage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Group from '../../../assets/svg/Group';
import Backarrow from '../../../assets/svg/Backarrow';
import BlueStars from '../../../assets/svg/BlueStars';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width: screenWidth} = Dimensions.get('window');

const EmptyComponent = () => null;

const isRenderableComponent = (candidate: any) =>
  typeof candidate === 'function' ||
  !!(candidate && typeof candidate === 'object' && candidate.$$typeof);

const resolveSvgComponent = (moduleRef: any) => {
  let current = moduleRef;

  for (let i = 0; i < 5; i += 1) {
    if (isRenderableComponent(current)) {
      return current;
    }

    if (current && typeof current === 'object' && 'default' in current) {
      current = current.default;
      continue;
    }

    break;
  }

  return EmptyComponent;
};

const GroupComponent = resolveSvgComponent(Group);
const BackarrowComponent = resolveSvgComponent(Backarrow);
const BlueStarsComponent = resolveSvgComponent(BlueStars);
const starsImage = require('../../../assets/images/Starsss.webp');

const SignIn: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignIn'>>();
  const [selected, setSelected] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  useSoftInputAdjustNothing();

  // Validation Schema
  let validationSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  });

  const getAuthErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  // Sign In
  const handleSignIn = async (values: any) => {
    setLoading(true);
    const normalizedEmail = values.email.toLowerCase();
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        normalizedEmail,
        values.password,
      );
      const user = userCredential?.user;
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      const userData = userDoc.data();
      const userRole = userData?.role;
      await messaging().requestPermission();
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      await firestore().collection('Users').doc(user.uid).update({
        fcmToken: fcmToken,
      });
      await AsyncStorage.setItem('password', values.password);
      await AsyncStorage.setItem('logout', 'no');
      await AsyncStorage.setItem('role', userRole);

      if (selected) {
        await AsyncStorage.setItem('email', normalizedEmail);
        await AsyncStorage.setItem('password', values.password);
      }

      let nextRoute: 'CleanerNavigator' | 'Premium' | 'Home' = 'Home';
      if (userRole === 'Cleaner') {
        const now = Date.now();
        const expiry = userData?.subscriptionEndDate;
        const hasActiveSub = expiry && expiry > now;
        nextRoute = hasActiveSub ? 'CleanerNavigator' : 'Premium';
      }

      showToast({
        type: 'success',
        title: 'Sign In',
        message: 'Logged in successfully!',
      });

      // Keep the success toast visible briefly before replacing the screen.
      await new Promise(resolve => setTimeout(resolve, 900));
      navigation.replace(nextRoute);
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code);

      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar
          barStyle={'light-content'}
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.container}>
          <View style={styles.topSection}>
            <View style={styles.topPattern}>
              <GroupComponent
                width={screenWidth + RFPercentage(10)}
                height={RFPercentage(26)}
                style={styles.groupSvg}
              />
            </View>

            <View style={styles.starContainer} pointerEvents="none">
              <Image
                source={starsImage}
                resizeMode="contain"
                style={styles.star}
              />
            </View>

            <Image source={IMAGES.logo} resizeMode="contain" style={styles.logo} />
          </View>

          <KeyboardAvoidingView
            style={styles.formSheet}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}>
              <View style={styles.formHeaderRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.backButton}
                  onPress={() =>
                    navigation.canGoBack()
                      ? navigation.goBack()
                      : navigation.navigate('UserSelection')
                  }>
                  <BackarrowComponent
                    width={RFPercentage(2)}
                    height={RFPercentage(2)}
                  />
                </TouchableOpacity>
                <Text style={styles.heading}>Log In</Text>
              </View>

              {/* Field Container */}
              <Formik
                initialValues={{
                  email: '',
                  password: '',
                }}
                validationSchema={validationSchema}
                onSubmit={values => handleSignIn(values)}>
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.fieldContainer}>
                      <View
                        style={[
                          styles.inputContainer,
                          touched.email && errors.email && styles.inputError,
                        ]}>
                        <TextInput
                          placeholder="Email"
                          placeholderTextColor={Colors.placeholderColor}
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          value={values.email}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          style={styles.inputText}
                        />
                      </View>
                      {touched.email && errors.email ? (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      ) : null}

                      <View
                        style={[
                          styles.inputContainer,
                          styles.inputGap,
                          touched.password && errors.password && styles.inputError,
                        ]}>
                        <View style={styles.passwordRow}>
                          <TextInput
                            placeholder="Password"
                            placeholderTextColor={Colors.placeholderColor}
                            onChangeText={handleChange('password')}
                            onBlur={handleBlur('password')}
                            value={values.password}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={!showPassword}
                            style={[styles.inputText, styles.passwordInput]}
                          />
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.passwordToggle}>
                            <Ionicons
                              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                              size={RFPercentage(2.1)}
                              color={Colors.secondaryText}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {touched.password && errors.password ? (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      ) : null}
                    </View>

                    <View style={styles.rowContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelected(!selected)}
                        style={styles.rememberRow}>
                        <View
                          style={[
                            styles.checkboxCircle,
                            selected && styles.checkboxCircleActive,
                          ]}>
                          {selected ? <View style={styles.checkboxInner} /> : null}
                        </View>
                        <Text style={styles.radioLabel}>Remember me</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.forgotPasswordButton}
                        onPress={() => navigation.navigate('ResetPassword')}>
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                      <GradientButton
                        title="Log In"
                        onPress={() => handleSubmit()}
                        loading={loading}
                        disabled={loading}
                        style={styles.signInButton}
                        textStyle={styles.signInButtonText}
                      />

                      <View style={styles.bottomContainer}>
                        <Text style={styles.bottomText}>Don't have an account?</Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('UserSelection')}>
                          <Text style={styles.signUp}>Signup</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </Formik>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.blueStarContainer} pointerEvents="none">
            <BlueStarsComponent style={styles.blueStar} />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#407BFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#407BFF',
  },
  topSection: {
    height: RFPercentage(25.5),
    backgroundColor: '#407BFF',
    borderBottomLeftRadius: RFPercentage(4),
    borderBottomRightRadius: RFPercentage(4),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  groupSvg: {
    marginTop: RFPercentage(-3),
  },
  logo: {
    width: RFPercentage(22.5),
    height: RFPercentage(8),
    marginTop: RFPercentage(-10),
    tintColor: Colors.white,
  },
  formSheet: {
    flex: 1,
    marginTop: RFPercentage(-7),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RFPercentage(4),
    borderTopRightRadius: RFPercentage(4),
    paddingTop: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(2.4),
  },
  formScrollContent: {
    flexGrow: 1,
    paddingBottom: RFPercentage(5),
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(2.2),
  },
  backButton: {
    width: RFPercentage(4.2),
    height: RFPercentage(4.2),
    borderRadius: RFPercentage(2.7),
    backgroundColor: 'rgba(160, 160, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.8),
  },
  radioLabel: {
    fontSize: RFPercentage(1.6),
    color: '#6B7280',
    marginLeft: RFPercentage(0.7),
    fontFamily: Fonts.fontRegular,
  },
  forgotPassword: {
    fontSize: RFPercentage(1.6),
    color: '#6B7280',
    fontFamily: Fonts.fontRegular,
  },
  heading: {
    color: '#1E1E1E',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
    marginLeft: RFPercentage(-0.25),
  },
  fieldContainer: {
    marginTop: RFPercentage(0.6),
  },
  inputContainer: {
    height: RFPercentage(7),
    borderWidth: RFPercentage(0.14),
    borderColor: '#E5E7EB',
    borderRadius: RFPercentage(2.1),
    paddingHorizontal: RFPercentage(2.2),
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontRegular,
    color: Colors.inputTextColor,
    paddingVertical: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    marginLeft: RFPercentage(1),
    paddingVertical: RFPercentage(0.3),
  },
  inputGap: {
    marginTop: RFPercentage(1.8),
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.55),
    marginLeft: RFPercentage(0.45),
  },
  rowContainer: {
    marginTop: RFPercentage(1.8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPasswordButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  checkboxCircle: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    borderWidth: RFPercentage(0.1),
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    borderColor: Colors.gradient1,
  },
  checkboxInner: {
    width: RFPercentage(1.45),
    height: RFPercentage(1.45),
    borderRadius: RFPercentage(0.8),
    backgroundColor: Colors.gradient1,
  },
  buttonContainer: {
    marginTop: RFPercentage(4.3),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
    width: '100%',
    height: RFPercentage(6.8),
    borderRadius: RFPercentage(5),
  },
  signInButtonText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.fontMedium,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(3.5),
    justifyContent: 'center',
  },
  bottomText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.70),
    fontFamily: Fonts.fontRegular,
  },
  signUp: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.70),
    fontFamily: Fonts.fontMedium,
    marginLeft: RFPercentage(0.55),
  },
  starContainer: {
    position: 'absolute',
    left: RFPercentage(1.4),
    top: RFPercentage(0),
    zIndex: 1,
  },
  star: {
    width: RFPercentage(7.5),
    height: RFPercentage(7.5),
  },
  blueStarContainer: {
    position: 'absolute',
    right: RFPercentage(0.9),
    bottom: RFPercentage(2),
    opacity: 0.18,
  },
  blueStar: {
    width: RFPercentage(9),
    height: RFPercentage(9),
  },
});
