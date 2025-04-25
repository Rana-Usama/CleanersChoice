import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import HeaderBack from '../../../../components/HeaderBack';
import GradientButton from '../../../../components/GradientButton';
import PasswordField from '../../../../components/PasswordField';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../../components/CustomModal';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as yup from 'yup';
import {Formik} from 'formik';

const ChangePasswordV2 = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ChangePasswordV2'>
    >();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    const user = auth().currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'User Sign In',
        text2: 'User not found',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
        position: 'top',
      });
      setLoading(false);
      return;
    }
    const credential = auth.EmailAuthProvider.credential(
      user?.email,
      values.oldPassword,
    );
    try {
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(values.password);
      await AsyncStorage.multiRemove(['email', 'password', 'role']);
      setModalVisible(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `${error?.message}`,
        topOffset: RFPercentage(8),
        position: 'top',
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
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <HeaderBack
          title={`Change Password`}
          textStyle={{fontSize: RFPercentage(2)}}
          left={true}
        />

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
                      <View style={{width: '90%', height: 16, bottom: 8}}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.3),
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
                <View style={{marginTop: RFPercentage(2)}}>
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
                <View style={{marginTop: RFPercentage(2)}}>
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
                      <View style={{width: '90%', height: 16, bottom: 8}}>
                        <Text
                          style={{
                            fontSize: RFPercentage(1.3),
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
                  />
                </View>
              </View>
            </>
          )}
        </Formik>
      </ScrollView>
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
              title={'Your password hase been successfuly changed!'}
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
