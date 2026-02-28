import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
  TouchableOpacity
} from 'react-native';
import React, {useState} from 'react';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import InputField from '../../../components/InputField';
import GradientButton from '../../../components/GradientButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../utils/ToastMessage';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ResetPassword: React.FC = ({navigation}: any) => {
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Validation Schema
  let validationSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  // Send Email
  const handleNext = async (values: any) => {
    if (values.email) {
      setLoading(true);
      try {
        // Check if email exists in Users collection
        const userQuery = await firestore()
          .collection('Users')
          .where('email', '==', values.email)
          .get();

        if (!userQuery.empty) {
          // Email exists → send reset password
          await auth().sendPasswordResetEmail(values.email);
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Reset password link sent to your email.',
          });
          setResetSent(true);
        } else {
          // Email not found
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Email not found in our records.',
          });
        }
      } catch (error) {
        console.error(error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Something went wrong. Try again later.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather
              name="arrow-left"
              color={Colors.white}
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            {/* Reset Password Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationIcon}>
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={RFPercentage(6)}
                  color={Colors.gradient1}
                />
              </View>
              <Text style={styles.illustrationTitle}>
                Forgot Your Password?
              </Text>
              <Text style={styles.illustrationText}>
                Enter your email address and we'll send you a link to reset your
                password.
              </Text>
            </View>

            {/* Form */}
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
                <View style={styles.formContainer}>
                  {/* Email Input Card */}
                  <View style={styles.inputCard}>
                    <View style={styles.inputHeader}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={RFPercentage(2.2)}
                        color={Colors.gradient1}
                      />
                      <Text style={styles.inputLabel}>Email Address</Text>
                    </View>
                    
                    <InputField
                      placeholder="Enter your registered email"
                      onChangeText={handleChange('email')}
                      handleBlur={handleBlur('email')}
                      value={values.email}
                      customStyle={[
                        styles.inputField,
                        touched.email &&
                          errors.email && {
                            borderColor: Colors.error,
                            borderWidth: 1,
                          },
                      ]}
                    />
                    
                    {touched.email && errors.email && (
                      <View style={styles.errorContainer}>
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={RFPercentage(1.8)}
                          color={Colors.error}
                        />
                        <Text style={styles.errorText}>{errors.email}</Text>
                      </View>
                    )}
                  </View>

                  {/* Reset Sent Success Message */}
                  {resetSent && (
                    <View style={styles.successCard}>
                      <View style={styles.successIcon}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={RFPercentage(3)}
                          color={Colors.success}
                        />
                      </View>
                      <Text style={styles.successTitle}>
                        Reset Link Sent!
                      </Text>
                      <Text style={styles.successText}>
                        We've sent you a password reset link. If it doesn't appear
                        in your inbox within a few minutes, please also check your
                        Spam or Junk folder.
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.backToLoginButton}>
                        <Feather name="log-in" size={18} color={Colors.white} />
                        <Text style={styles.backToLoginText}>
                          Back to Login
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.buttonSection}>
                    <GradientButton
                      title="Send Reset Link"
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading}
                      style={styles.resetButton}
                      textStyle={styles.resetButtonText}
                    />
                    
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SignIn')}
                      style={styles.cancelButton}>
                      <Feather
                        name="arrow-left"
                        size={RFPercentage(2)}
                        color={Colors.gradient1}
                      />
                      <Text style={styles.cancelButtonText}>
                        Back to Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <MaterialCommunityIcons
                name="shield-check"
                size={RFPercentage(2)}
                color={Colors.secondaryText}
              />
              <Text style={styles.securityText}>
                Your email is secure with us. We'll only send password reset
                instructions to verified accounts.
              </Text>
            </View>

            {/* Decorative Star */}
            <View style={styles.starContainer}>
              <Image
                source={IMAGES.stars}
                resizeMode="contain"
                style={styles.starImage}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  placeholderView: {
    width: RFPercentage(4.5),
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(7) : RFPercentage(7),
    paddingBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(20),
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(3),
    marginBottom: RFPercentage(2),
  },
  illustrationIcon: {
    width: RFPercentage(10),
    height: RFPercentage(10),
    borderRadius: RFPercentage(5),
    backgroundColor: Colors.blueTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(2),
    borderWidth: 2,
    borderColor: Colors.blueTintBorder,
  },
  illustrationTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginBottom: RFPercentage(1),
  },
  illustrationText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(2),
  },
  formContainer: {
    paddingHorizontal: RFPercentage(2),
  },
  inputCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: RFPercentage(2),
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 16,
    // elevation: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: RFPercentage(2),
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  inputLabel: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  inputField: {
    width: '100%',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  errorText: {
    color: Colors.error,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    flex: 1,
    lineHeight:RFPercentage(1.5)
  },
  successCard: {
    backgroundColor: Colors.successBg,
    borderRadius: 16,
    padding: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.successBorder,
    marginBottom: RFPercentage(2),
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: RFPercentage(1.5),
  },
  successTitle: {
    color: Colors.successText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(1),
    textAlign: 'center',
  },
  successText: {
    color: Colors.successText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1.5),
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    borderRadius: 12,
    gap: RFPercentage(0.8),
  },
  backToLoginText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  buttonSection: {
    marginBottom: RFPercentage(2),
  },
  resetButton: {
    width: '55%',
    marginBottom: RFPercentage(1.5),
    alignSelf:"center"
  },
  resetButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    lineHeight:RFPercentage(1.9)
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  cancelButtonText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.inputBg,
    marginHorizontal: RFPercentage(2),
    padding: RFPercentage(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: RFPercentage(1),
    marginBottom: RFPercentage(2),
  },
  securityText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    flex: 1,
    lineHeight: RFPercentage(2),
  },
  starContainer: {
    position: 'absolute',
    right: RFPercentage(1.5),
    bottom: RFPercentage(5),
    opacity: 0.2,
  },
  starImage: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});