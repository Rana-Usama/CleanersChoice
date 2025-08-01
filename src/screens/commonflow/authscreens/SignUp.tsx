import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {Fonts, IMAGES, Colors, Icons} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
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
import axios from 'axios';

const SignUp: React.FC = ({navigation}: any) => {
  const [selected, setSelected] = useState<boolean>(false);
  const [img, setImg] = useState<any>(null);
  const userFlow = useSelector(state => state.userFlow);
  const [loading, setLoading] = useState<boolean>(false);

  // Validation Schema
  let validationSchema = yup.object({
    name: yup.string().required('Username is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup
      .string()
      .required('Phone is required')
      .matches(/^\+1-\d{3}-\d{3}-\d{4}$/, 'Enter a valid US phone number'),
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
      .catch(error => {});
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

      const data = new FormData();
      data.append('file', {
        uri: compressedImage,
        type: 'image/jpeg',
        name: `profile_${user.uid}.jpg`,
      });
      data.append('upload_preset', 'CleanersChoice');
      data.append('cloud_name', 'dfd65wawq'); 

      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dfd65wawq/image/upload',
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      profileUrl = res.data.secure_url;
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
      message: 'Signed Up successfully',
    });
    navigation.navigate(userFlow?.userFlow === 'Customer' ? 'Home' : 'Premium');
  } catch (error: any) {
    console.error( error);
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
  const formatPhoneNumber = (raw: string = ''): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('1')) digits = digits.slice(1);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(-10);
    if (digits.length < 10) return `+1-${digits}`;

    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);

    return `+1-${area}-${prefix}-${line}`; // -> "+1-440-147-6925"
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: RFPercentage(8)}}>
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
                      length={15}
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
                    <TouchableOpacity activeOpacity={0.8}  onPress={() => setSelected(!selected)} style={styles.radioInnerContainer}>
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
                    </TouchableOpacity>
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
                        <Text style={styles.signIn}>SignIn</Text>
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
  errorContainer: {width: '90%', height: RFPercentage(2), bottom: RFPercentage(0.8)},
  backArrow: {
    position: 'absolute',
    top: RFPercentage(7),
    left: RFPercentage(3),
  },
  errorText: {
    fontSize: RFPercentage(1.5),
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
    textAlign: 'center',
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
