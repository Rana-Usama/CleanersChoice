import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../../components/HeaderBack';
import GradientButton from '../../../../components/GradientButton';
import PasswordField from '../../../../components/PasswordField';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../../components/CustomModal';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as yup from 'yup';
import {Formik} from 'formik';
import {showToast} from '../../../../utils/ToastMessage';
import {EmailAuthProvider} from '@react-native-firebase/auth';

const ChangePasswordV2 = ({navigation}: any) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Validations
  let validationSchema = yup.object({
    oldPassword: yup.string().required('Password is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Passwords must match'),
  });

  // Change Password
  const handleChangePassword = async (values: any) => {
    setLoading(true);
    const user = auth().currentUser;
    if (!user) {
      showToast({
        type: 'error',
        title: 'User Sign In',
        message: 'User not found',
      });
      setLoading(false);
      return;
    }
    const credential = EmailAuthProvider.credential(
      user?.email,
      values.oldPassword,
    );
    try {
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(values.password);
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      setModalVisible(true);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Password Change',
        message: 'Password not changed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title={`Change Password`}
        textStyle={{fontSize: RFPercentage(2)}}
        left={true}
      />
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <Formik
          initialValues={{
            oldPassword: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={values => handleChangePassword(values)}>
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
                <View style={{marginTop: RFPercentage(4)}}>
                  <Text style={styles.label}>Old Password</Text>
                  <PasswordField
                    placeholder="Enter old password"
                    onChangeText={handleChange('oldPassword')}
                    handleBlur={handleBlur('oldPassword')}
                    value={values.oldPassword}
                    customStyle={{
                      width: '100%',
                      borderColor:
                        touched.oldPassword && errors.oldPassword
                          ? Colors.error
                          : Colors.inputFieldColor,
                    }}
                  />
                  {touched.oldPassword && errors.oldPassword && (
                    <>
                      <View
                        style={{
                          width: '90%',
                          height: 16,
                          bottom: RFPercentage(0.8),
                        }}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.5),
                            fontFamily: Fonts.fontRegular,
                            color: Colors.error,
                            textAlign: 'left',
                          }}>
                          {errors.oldPassword}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
                <View style={{marginTop: RFPercentage(1)}}>
                  <Text style={styles.label}>New Password</Text>
                  <PasswordField
                    placeholder="Enter new password"
                    onChangeText={handleChange('password')}
                    handleBlur={handleBlur('password')}
                    value={values.password}
                    customStyle={{
                      width: '100%',
                      borderColor:
                        touched.password && errors.password
                          ? Colors.error
                          : Colors.inputFieldColor,
                    }}
                  />
                  {touched.password && errors.password && (
                    <>
                      <View
                        style={{
                          width: '90%',
                          height: 16,
                          bottom: RFPercentage(0.8),
                        }}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.5),
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
                <View style={{marginTop: RFPercentage(1)}}>
                  <Text style={styles.label}>Repeat New Password</Text>
                  <PasswordField
                    placeholder="Re-enter new password"
                    onChangeText={handleChange('confirmPassword')}
                    handleBlur={handleBlur('confirmPassword')}
                    value={values.confirmPassword}
                    customStyle={{
                      width: '100%',
                      borderColor:
                        touched.confirmPassword && errors.confirmPassword
                          ? Colors.error
                          : Colors.inputFieldColor,
                    }}
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <>
                      <View
                        style={{
                          width: '90%',
                          height: 16,
                          bottom: RFPercentage(0.8),
                        }}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.5),
                            fontFamily: Fonts.fontRegular,
                            color: Colors.error,
                            textAlign: 'left',
                          }}>
                          {errors.confirmPassword}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={{marginTop: RFPercentage(6), alignSelf: 'center'}}>
                  <GradientButton
                    title="Change"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                  />
                </View>
              </View>
            </>
          )}
        </Formik>
      </ScrollView>

      {/* Confirmation Modal */}
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{position: 'absolute', width: '100%', height: '100%'}}>
            <BlurView
              style={{width: '100%', height: '100%', position: 'absolute'}}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal
              passwordModal={true}
              title='Chnage Password'
              subTitle={'Your password hase been successfuly changed!'}
              onPress3={() => {
                navigation.navigate('SignIn');
                setModalVisible(false);
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

export default ChangePasswordV2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  label: {
    color: Colors.brown,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
