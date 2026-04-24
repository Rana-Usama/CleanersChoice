import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Dimensions,
} from 'react-native';
import React, {useState} from 'react';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import GradientButton from '../../../components/GradientButton';
import ImagePicker from 'react-native-image-crop-picker';
import {useSelector} from 'react-redux';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import {Image as CompressorImage} from 'react-native-compressor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import {showToast} from '../../../utils/ToastMessage';
import firestore from '@react-native-firebase/firestore';
import Group from '../../../assets/svg/Group';
import Backarrow from '../../../assets/svg/Backarrow';
import BlueStars from '../../../assets/svg/BlueStars';
import {SafeAreaView} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

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

const SignUp: React.FC = ({navigation}: any) => {
  const [selected, setSelected] = useState<boolean>(false);
  const [img, setImg] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const userFlow = useSelector((state: any) => state.userFlow);

  const validationSchema = yup.object({
    name: yup.string().required('Username is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup
      .string()
      .nullable()
      .notRequired()
      .matches(
        /^\+1-\d{3}-\d{3}-\d{4}$/,
        'Enter a valid US phone number (e.g. +1-321-659-6898)',
      )
      .test(
        'optional-phone',
        'Enter a valid US phone number',
        value => !value || /^\+1-\d{3}-\d{3}-\d{4}$/.test(value),
      ),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Passwords must match'),
  });

  const uploadImg = () => {
    ImagePicker.openPicker({
      width: 1000,
      height: 1000,
      cropping: true,
    })
      .then(image => {
        setImg(image);
      })
      .catch(() => {});
  };

  const getSignupErrorMessage = (errorCode: any) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong while creating your account.';
    }
  };

  const handleSignUp = async (values: any) => {
    if (!selected) {
      showToast({
        type: 'info',
        title: 'Terms & Conditions',
        message: 'Please accept terms and conditions in order to proceed',
      });
      return;
    }

    setLoading(true);
    const normalizedEmail = values.email.toLowerCase();

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        normalizedEmail,
        values.password,
      );
      const user = userCredential.user;

      let profileUrl = '';

      if (img) {
        const compressedImage = await CompressorImage.compress(img?.path, {
          compressionMethod: 'manual',
          maxWidth: 1000,
          quality: 0.8,
        });
        const reference = storage().ref(
          `profileImages/profile_${user.uid}.jpg`,
        );
        await reference.putFile(compressedImage);
        profileUrl = await reference.getDownloadURL();
      }

      await messaging().requestPermission();
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      const userData = {
        name: values.name,
        email: normalizedEmail,
        phone: values.phone || null,
        uid: user.uid,
        profile: profileUrl || null,
        fcmToken: fcmToken || null,
        createdAt: new Date(),
        admin: false,
        role: userFlow?.userFlow,
        ...(userFlow?.userFlow === 'Cleaner' && {
          subscription: false,
          subscriptionId: null,
          cancelSubscription: false,
        }),
      };

      await firestore().collection('Users').doc(user.uid).set(userData);
      await AsyncStorage.setItem('email', normalizedEmail);
      await AsyncStorage.setItem('password', values.password);
      await AsyncStorage.setItem('role', userFlow?.userFlow);

      showToast({
        type: 'success',
        title: 'Sign Up',
        message: 'Signed Up successfully',
      });

      navigation.navigate(
        userFlow?.userFlow === 'Customer' ? 'Home' : 'Premium',
      );
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Sign Up Failed',
        message: getSignupErrorMessage(error.code),
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (raw: string = ''): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('1')) digits = digits.slice(1);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(-10);

    if (digits.length < 10) return `+1-${digits}`;

    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `+1-${area}-${prefix}-${line}`;
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

            <Image source={IMAGES.logo} resizeMode="contain" style={styles.logo} />
          </View>

          <View style={styles.formSheet}>
            <KeyboardAwareScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
              enableOnAndroid
              extraHeight={Platform.OS === 'ios' ? 80 : 120}
              extraScrollHeight={Platform.OS === 'ios' ? 24 : 40}
              keyboardOpeningTime={0}>
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

                <Text style={styles.heading}>Sign Up</Text>
              </View>

              <Formik
                initialValues={{
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                }}
                validationSchema={validationSchema}
                onSubmit={values => handleSignUp(values)}>
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
                          touched.name && errors.name && styles.inputError,
                        ]}>
                        <TextInput
                          placeholder="Username"
                          placeholderTextColor={Colors.placeholderColor}
                          onChangeText={handleChange('name')}
                          onBlur={handleBlur('name')}
                          value={values.name}
                          autoCapitalize="words"
                          style={styles.inputText}
                        />
                      </View>
                      {touched.name && errors.name ? (
                        <Text style={styles.errorText}>{errors.name}</Text>
                      ) : null}

                      <View
                        style={[
                          styles.inputContainer,
                          styles.inputGap,
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

                      <View
                        style={[
                          styles.inputContainer,
                          styles.inputGap,
                          touched.confirmPassword &&
                            errors.confirmPassword &&
                            styles.inputError,
                        ]}>
                        <View style={styles.passwordRow}>
                          <TextInput
                            placeholder="Confirm Password"
                            placeholderTextColor={Colors.placeholderColor}
                            onChangeText={handleChange('confirmPassword')}
                            onBlur={handleBlur('confirmPassword')}
                            value={values.confirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={!showConfirmPassword}
                            style={[styles.inputText, styles.passwordInput]}
                          />
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={styles.passwordToggle}>
                            <Ionicons
                              name={
                                showConfirmPassword
                                  ? 'eye-outline'
                                  : 'eye-off-outline'
                              }
                              size={RFPercentage(2.1)}
                              color={Colors.secondaryText}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {touched.confirmPassword && errors.confirmPassword ? (
                        <Text style={styles.errorText}>
                          {errors.confirmPassword}
                        </Text>
                      ) : null}

                      <View
                        style={[
                          styles.inputContainer,
                          styles.inputGap,
                          touched.phone && errors.phone && styles.inputError,
                        ]}>
                        <TextInput
                          placeholder="Phone Number (optional)"
                          placeholderTextColor={Colors.placeholderColor}
                          onChangeText={text => {
                            const formatted = formatPhoneNumber(text);
                            handleChange('phone')(formatted);
                          }}
                          onBlur={handleBlur('phone')}
                          value={values.phone}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="phone-pad"
                          maxLength={15}
                          style={styles.inputText}
                        />
                      </View>
                      {touched.phone && errors.phone && values.phone !== '' ? (
                        <Text style={styles.errorText}>{errors.phone}</Text>
                      ) : null}
                    </View>

                    <View style={styles.termsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelected(!selected)}
                        style={styles.termsTouchable}>
                        <View
                          style={[
                            styles.checkboxCircle,
                            selected && styles.checkboxCircleActive,
                          ]}>
                          {selected ? <View style={styles.checkboxInner} /> : null}
                        </View>
                        <Text style={styles.termsText}>
                          I agree to terms and conditions
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                      <GradientButton
                        title="Sign Up"
                        onPress={() => handleSubmit()}
                        loading={loading}
                        disabled={loading}
                        style={styles.signUpButton}
                        textStyle={styles.signUpButtonText}
                      />

                      <View style={styles.bottomContainer}>
                        <Text style={styles.bottomText}>
                          Already have an account?
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('SignIn')}>
                          <Text style={styles.loginText}>Login</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </Formik>
            </KeyboardAwareScrollView>
          </View>

          <View style={styles.starContainer} pointerEvents="none">
            <BlueStarsComponent style={styles.star} />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;

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
    marginTop: RFPercentage(-7.5),
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
    paddingBottom: RFPercentage(8),
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
  heading: {
    color: '#1E1E1E',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.05),
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
  termsRow: {
    marginTop: RFPercentage(2.1),
  },
  termsTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
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
  termsText: {
    fontSize: RFPercentage(1.6),
    color: '#6B7280',
    marginLeft: RFPercentage(0.7),
    fontFamily: Fonts.fontRegular,
  },
  buttonContainer: {
    marginTop: RFPercentage(4),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    height: RFPercentage(6.8),
    borderRadius: RFPercentage(5),
  },
  signUpButtonText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.fontMedium,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(3),
    justifyContent: 'center',
  },
  bottomText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
  },
  loginText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    marginLeft: RFPercentage(0.55),
  },
  starContainer: {
    position: 'absolute',
    right: RFPercentage(0.9),
    bottom: RFPercentage(2),
    opacity: 0.18,
  },
  star: {
    width: RFPercentage(9),
    height: RFPercentage(9),
  },
});