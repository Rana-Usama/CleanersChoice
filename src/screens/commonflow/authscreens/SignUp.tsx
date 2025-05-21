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
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {RadioButtonInput} from 'react-native-simple-radio-button';
import HeaderComponent from '../../../components/HeaderComponent';
import InputField from '../../../components/InputField';
import PasswordField from '../../../components/PasswordField';
import GradientButton from '../../../components/GradientButton';
import ImagePicker from 'react-native-image-crop-picker';
import {useSelector} from 'react-redux';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {Image as CompressorImage} from 'react-native-compressor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import messaging from '@react-native-firebase/messaging';
import {showToast} from '../../../utils/ToastMessage';

const SignUp: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignUp'>>();
  const [selected, setSelected] = useState<boolean>(false);
  const [img, setImg] = useState<any>(null);
  const userFlow = useSelector(state => state.userFlow);
  const [loading, setLoading] = useState<boolean>(false);

  // Validation Schema
  let validationSchema = yup.object({
    name: yup.string().required('Username is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Passwords must match'),
  });

  // Uploading Image
  const uploadImg = () => {
    ImagePicker.openPicker({
      width: 1000,
      height: 1000,
      cropping: true,
    })
      .then(image => {
        setImg(image);
      })
      .catch(error => {
        console.log('Image Picker Error:', error);
      });
  };

  // Sign Up
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
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        values.email,
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
        const uploadUri = compressedImage.replace('file://', '');
        const fileName = `profile_${user.uid}.jpg`;
        const storageRef = storage().ref(`user_profiles/${fileName}`);
        const uploadTask = storageRef.putFile(uploadUri);
        await uploadTask;
        profileUrl = await storageRef.getDownloadURL();
      }
      const fcmToken = await messaging().getToken();
      const userData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        uid: user.uid,
        profile: profileUrl || null,
        fcmToken: fcmToken || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        role: userFlow?.userFlow,
        ...(userFlow?.userFlow === 'Cleaner' && {
          subscription: false,
          subscriptionId: null,
          cancelSubscription: false,
        }),
      };

      await firestore().collection('Users').doc(user.uid).set(userData);
      await AsyncStorage.setItem('email', values.email);
      await AsyncStorage.setItem('password', values.password);
      await AsyncStorage.setItem('role', userFlow?.userFlow);

      showToast({
        type: 'success',
        title: 'Sign Up',
        message: 'Signed Up successfully ',
      });
      navigation.navigate(
        userFlow?.userFlow === 'Customer' ? 'Home' : 'Premium',
      );
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Sign Up Failed',
        message: 'Email is already in use',
      });
    } finally {
      setLoading(false);
    }
  };

  // Phone Validation
  const formatPhoneNumber = (phoneNumber: any) => {
    if (!phoneNumber) return '';
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('1')) {
      cleaned = `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      cleaned = `+1${cleaned.slice(1)}`;
    } else if (!cleaned.startsWith('+1')) {
      cleaned = `+1${cleaned}`;
    }
    const match = cleaned.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    if (!match) return cleaned;
    return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView>
          
          {/* Header */}
          <View style={styles.container}>
            <TouchableOpacity
              onPress={() => navigation.navigate('UserSelection')}
              style={styles.backArrow}>
              <AntDesign
                name="arrowleft"
                color={Colors.secondaryText}
                size={RFPercentage(3)}
              />
            </TouchableOpacity>
            <HeaderComponent />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Create an account</Text>
            </View>

            {/* Image Uploader */}
            <View style={styles.imgContainer}>
              <TouchableOpacity activeOpacity={0.5} onPress={uploadImg}>
                <View style={styles.pictureContainer}>
                  {img ? (
                    <>
                      <Image
                        source={{uri: img?.path}}
                        resizeMode="cover"
                        style={styles.imgStyle}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.imgText}>Upload Picture</Text>
                    </>
                  )}
                </View>
                {img && (
                  <>
                    <TouchableOpacity onPress={uploadImg}>
                      <Image
                        source={Icons.edit}
                        resizeMode="contain"
                        style={styles.uploadedImg}
                      />
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Fields Container */}
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
                    {/* User Name */}
                    <InputField
                      placeholder="Username"
                      onChangeText={handleChange('name')}
                      handleBlur={handleBlur('name')}
                      value={values.name}
                      customStyle={{
                        borderColor:
                          touched.name && errors.name
                            ? Colors.error
                            : Colors.inputFieldColor,
                      }}
                    />
                    {touched.name && errors.name && (
                      <>
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{errors.name}</Text>
                        </View>
                      </>
                    )}

                    {/* Email */}
                    <InputField
                      placeholder="Email"
                      onChangeText={handleChange('email')}
                      handleBlur={handleBlur('email')}
                      value={values.email}
                      customStyle={{
                        borderColor:
                          touched.email && errors.email
                            ? Colors.error
                            : Colors.inputFieldColor,
                      }}
                    />
                    {touched.email && errors.email && (
                      <>
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{errors.email}</Text>
                        </View>
                      </>
                    )}

                    {/* Password */}
                    <PasswordField
                      placeholder="Password"
                      onChangeText={handleChange('password')}
                      handleBlur={handleBlur('password')}
                      value={values.password}
                      customStyle={{
                        borderColor:
                          touched.password && errors.password
                            ? Colors.error
                            : Colors.inputFieldColor,
                      }}
                    />
                    {touched.password && errors.password && (
                      <>
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>
                            {errors.password}
                          </Text>
                        </View>
                      </>
                    )}

                    {/* Confirm Password */}
                    <PasswordField
                      placeholder="Confirm Password"
                      onChangeText={handleChange('confirmPassword')}
                      handleBlur={handleBlur('confirmPassword')}
                      value={values.confirmPassword}
                      customStyle={{
                        borderColor:
                          touched.confirmPassword && errors.confirmPassword
                            ? Colors.error
                            : Colors.inputFieldColor,
                      }}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <>
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>
                            {errors.confirmPassword}
                          </Text>
                        </View>
                      </>
                    )}

                    {/* Phone */}
                    <InputField
                      placeholder="e.g. +1 (321) 659-6898"
                      onChangeText={text => {
                        const formatted = formatPhoneNumber(text);
                        handleChange('phone')(formatted);
                      }}
                      type={'phone-pad'}
                      length={16}
                      handleBlur={handleBlur('phone')}
                      value={values.phone}
                      customStyle={{
                        borderColor:
                          touched.phone && errors.phone
                            ? Colors.error
                            : Colors.inputFieldColor,
                      }}
                    />
                    {touched.phone && errors.phone && (
                      <>
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>{errors.phone}</Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Terms And Conditions */}
                  <View style={styles.radioContainer}>
                    <View style={styles.radioInnerContainer}>
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
                        buttonSize={RFPercentage(1.4)}
                        buttonOuterSize={RFPercentage(2.2)}
                      />
                      <Text style={styles.radioLabel}>
                        I agree to terms and conditions
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Container */}
                  <View style={styles.buttonContainer}>
                    <GradientButton
                      title="Sign Up"
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading}
                    />
                    <View style={styles.buttonInnerContainer}>
                      <Text style={styles.bottomText}>
                        Already have an account?
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('SignIn')}>
                        <Text style={styles.signIn}>Signin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </Formik>
          </View>

          {/* Bottom Stars */}
          <View style={styles.starContainer}>
            <Image
              source={IMAGES.stars}
              resizeMode="contain"
              style={styles.star}
            />
          </View>
          <View style={{marginBottom: RFPercentage(5)}} />
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    backgroundColor: Colors.background,
  },
  errorContainer: {width: '90%', height: RFPercentage(2), bottom: 8},
  backArrow: {
    position: 'absolute',
    top: RFPercentage(7),
    left: RFPercentage(3),
  },
  errorText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.error,
    textAlign: 'left',
  },
  titleContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
  title: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.2),
    textAlign: 'center',
  },
  imgContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(3),
  },
  pictureContainer: {
    width: RFPercentage(13.5),
    height: RFPercentage(13.5),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 1.8,
    borderColor: 'rgba(64, 123, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
  },
  imgStyle: {
    width: RFPercentage(12.5),
    height: RFPercentage(12.5),
    borderRadius: RFPercentage(10),
  },
  imgText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    left: RFPercentage(8.5),
    bottom: RFPercentage(0.4),
  },
  fieldContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '95%',
  },
  radioInnerContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    marginLeft: RFPercentage(0.8),
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(5),
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(2),
  },
  bottomText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
  },
  signIn: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    left: 3,
  },
  starContainer: {
    position: 'absolute',
    bottom: RFPercentage(14),
    right: RFPercentage(1.5),
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
