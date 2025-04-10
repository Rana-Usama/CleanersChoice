import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import InputField from '../../../components/InputField';
import GradientButton from '../../../components/GradientButton';
import HeaderBack from '../../../components/HeaderBack';
import * as yup from 'yup';
import {Formik} from 'formik';
import Toast from 'react-native-toast-message';

const ChangePassword: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>
    >();
  const [loading, setLoading] = useState(false);

  let validationSchema = yup.object({
    password: yup.string().required('Password is required'),
    confirmPassword: yup
      .string()
      .required('Confirm Password is required')
      .oneOf([yup.ref('password')], 'Passwords must match'),
  });

  const handleNext = (values: any) => {
    if (values.password && values.confirmPassword) {
      setLoading(true);
      setTimeout(() => {
        navigation.navigate('SignIn');
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <HeaderBack title={'Set New Password'} left={true} />

        <Formik
          initialValues={{
            password: '',
            confirmPassword: '',
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
                    placeholder="Enter new Password"
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
                  <InputField
                    placeholder="Repeat new Password"
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
                </View>

                <View style={styles.buttonContainer}>
                  <GradientButton
                    title="Save"
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
            style={styles.starImage}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(3),
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
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    bottom: RFPercentage(6),
    right: RFPercentage(1.5),
  },
  starImage: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
