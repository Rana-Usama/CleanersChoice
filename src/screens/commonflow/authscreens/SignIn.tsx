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
import {Fonts, IMAGES, Colors, Icons} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {RadioButtonInput} from 'react-native-simple-radio-button';
import HeaderComponent from '../../../components/HeaderComponent';
import InputField from '../../../components/InputField';
import PasswordField from '../../../components/PasswordField';
import GradientButton from '../../../components/GradientButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const SignIn: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignIn'>>();
  const [selected, setSelected] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  let validationSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  });

  const handleSignIn = async (values: any) => {
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        values.email,
        values.password,
      );

      const user = userCredential?.user;
      if (!user) throw new Error('No user found after sign-in.');

      const userDoc = await firestore().collection('Users').doc(user.uid).get();

      if (!userDoc.exists) throw new Error('User data not found in Firestore.');

      const userData = userDoc.data();
      const userRole = userData?.role;
      const fcmToken = await messaging().getToken();
      await firestore().collection('Users').doc(user.uid).update({
        fcmToken: fcmToken,
      });

      Toast.show({
        type: 'success',
        text1: 'Sign In',
        text2: 'Logged in successful!',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });

      if (selected) {
        await AsyncStorage.setItem('email', values.email);
        await AsyncStorage.setItem('password', values.password);
        await AsyncStorage.setItem('role', userRole);
        AsyncStorage.removeItem('logout');
      }

      if (userRole === 'Cleaner') {
        if (userData?.subscription === true) {
          await navigation.replace('CleanerNavigator');
        } else {
          await navigation.replace('Premium');
        }
      } else {
        await navigation.replace('Home');
      }
    } catch (error) {
      console.error('Sign In Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: 'Invalid credentials',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <HeaderComponent />
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Welcome Back</Text>
          </View>

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
                      <View style={{width: '90%', height: 16, bottom: 8}}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.3),
                            fontFamily: Fonts.fontRegular,
                            color: Colors.error,
                            textAlign: 'left',
                          }}>
                          {errors.email}
                        </Text>
                      </View>
                    </>
                  )}
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
                      <View style={{width: '90%', height: 16, bottom: 8}}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.3),
                            fontFamily: Fonts.fontRegular,
                            color: Colors.error,
                            textAlign: 'left',
                          }}>
                          {errors.password}
                        </Text>
                      </View>
                    </>
                  )}
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
                        buttonSize={RFPercentage(1.4)}
                        buttonOuterSize={RFPercentage(2)}
                      />
                      <Text style={styles.radioLabel}>Remember me?</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('ResetPassword')}
                      style={{position: 'absolute', right: 0}}>
                      <Text style={styles.forgotPassword}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <GradientButton
                    title="Sign In"
                    onPress={handleSubmit}
                    loading={loading}
                  />
                  <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>
                      Don't have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('UserSelection')}>
                      <Text style={styles.signUp}>Signup</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </Formik>

          <View style={styles.starContainer}>
            <Image
              source={IMAGES.stars}
              resizeMode="contain"
              style={styles.star}
            />
          </View>
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
    // backgroundColor: 'red',
    flex: 1,
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
    fontSize: RFPercentage(1.5),
    color: Colors.primaryText,
    marginLeft: RFPercentage(0.8),
    fontFamily: Fonts.fontRegular,
  },
  forgotPassword: {
    fontSize: RFPercentage(1.5),
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
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
  },
  signUp: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    left: 3,
  },
  starContainer: {
    // position: 'absolute',
    // bottom: RFPercentage(6),
    right: RFPercentage(1.5),
    top: RFPercentage(15),
    alignSelf: 'flex-end',
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
