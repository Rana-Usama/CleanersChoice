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
import {useSelector} from 'react-redux';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';

const SignIn: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignIn'>>();
  const [selected, setSelected] = useState<boolean>(false);
  const userFlow = useSelector(state => state.userFlow);
const [loading, setLoading] = useState(false)
  let validationSchema = yup.object({
    name: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
  });


  const handleSignIn = async (values: any) => {
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(values.email, values.password);
      const user = userCredential.user;
  
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
  
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userRole = userData?.role; 
  
        Toast.show({
          type: 'success',
          text1: 'Sign In',
          text2: 'Login successful!',
          position: 'top',
        });
  
        if (userRole === 'Customer') {
          navigation.replace('Home'); 
        } else {
          navigation.replace('CleanerNavigator'); 
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign In Failed',
          text2: 'User data not found',
          position: 'top',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2:
          error.code === 'auth/user-not-found'
            ? 'User not found'
            : error.code === 'auth/wrong-password'
            ? 'Incorrect password'
            : error.message,
        position: 'top',
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <View style={styles.container}>
          <HeaderComponent />
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Welcome Back</Text>
          </View>

          <Formik
            initialValues={{
              name: '',
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
                        buttonSize={8}
                        buttonOuterSize={14}
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
                  <GradientButton title="Sign In" onPress={handleSubmit} />
                  <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>
                      Don't have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SignUp')}>
                      <Text style={styles.signUp}>Signup</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </Formik>
        </View>
        <View style={styles.starContainer}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={styles.star}
          />
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
    backgroundColor: Colors.background,
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
    fontSize: RFPercentage(1.4),
    color: Colors.primaryText,
    marginLeft: 6,
    fontFamily: Fonts.fontRegular,
  },
  forgotPassword: {
    fontSize: RFPercentage(1.4),
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
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  signUp: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    left: 3,
  },
  starContainer: {
    position: 'absolute',
    bottom: RFPercentage(6),
    right: RFPercentage(1.5),
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
