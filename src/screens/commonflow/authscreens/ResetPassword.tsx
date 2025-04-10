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
import InputField from '../../../components/InputField';
import GradientButton from '../../../components/GradientButton';
import HeaderBack from '../../../components/HeaderBack';
import * as yup from 'yup';
import {Formik} from 'formik';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

const ResetPassword: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>
    >();
  const [loading, setLoading] = useState(false);

  let validationSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  const handleNext = async (values: any) => {
    if (values.email) {
      setLoading(true);
      try {
        await auth().sendPasswordResetEmail(values.email);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Reset password link sent to your email.',
          position: 'top',
          topOffset: RFPercentage(8),
          text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
          text2Style: {
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.4),
          },
        });
        navigation.navigate('SignIn');
      } catch (error) {
        console.log('Error sending email:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.message,
          topOffset: RFPercentage(8),
          text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
          text2Style: {
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.4),
          },
          position: 'top',
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Error: Email is required');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView>
        <HeaderBack title={'Reset Password?'} left={true} />

        <Formik
          initialValues={{
            email: '',
          }}
          validationSchema={validationSchema}
          onSubmit={values => handleNext(values)}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <>
              <View style={styles.container}>
                <View style={styles.inputContainer}>
                  <InputField
                    placeholder="Enter Email"
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
                </View>

                <View style={styles.buttonContainer}>
                  <GradientButton
                    title="Enter Email"
                    onPress={handleSubmit}
                    loading={loading}
                  />
                </View>
              </View>
            </>
          )}
        </Formik>
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
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(4),
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
    // bottom: RFPercentage(8),
    right: RFPercentage(1.5),
    top: RFPercentage(70),
  },
  imageStyle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
