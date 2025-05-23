import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import React, {useState} from 'react';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import InputField from '../../../components/InputField';
import GradientButton from '../../../components/GradientButton';
import HeaderBack from '../../../components/HeaderBack';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../utils/ToastMessage';

const ResetPassword: React.FC = ({navigation} : any) => {
  const [loading, setLoading] = useState(false);

  // Validation Schema
  let validationSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  // Send Email
  const handleNext = async (values: any) => {
    if (values.email) {
      setLoading(true);
      try {
        await auth().sendPasswordResetEmail(values.email);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Reset password link sent to your email.',
        });
        navigation.navigate('SignIn');
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Error sending link try again.',
        });
      } finally {
        setLoading(false);
      }
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

        {/* Field Container */}
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
                    disabled={loading}
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
