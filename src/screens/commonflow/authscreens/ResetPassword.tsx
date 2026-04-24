import {
	Image,
	StatusBar,
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Keyboard,
	TextInput,
	Dimensions,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import GradientButton from '../../../components/GradientButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../utils/ToastMessage';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Group from '../../../assets/svg/Group';
import Backarrow from '../../../assets/svg/Backarrow';
import BlueStars from '../../../assets/svg/BlueStars';
import MessageIcon from '../../../assets/svg/messageicon';

const {width: screenWidth} = Dimensions.get('window');

const EmptyComponent = () => null;

const isRenderableComponent = (candidate: any) =>
	typeof candidate === 'function' ||
	!!(candidate && typeof candidate === 'object' && candidate.$$typeof);

const resolveSvgComponent = (moduleRef: any) => {
	let current = moduleRef;

	for (let i = 0; i < 5; i += 1) {
		if (isRenderableComponent(current)) {
			return current;
		}

		if (current && typeof current === 'object' && 'default' in current) {
			current = current.default;
			continue;
		}

		break;
	}

	return EmptyComponent;
};

const GroupComponent = resolveSvgComponent(Group);
const BackarrowComponent = resolveSvgComponent(Backarrow);
const BlueStarsComponent = resolveSvgComponent(BlueStars);
const MessageIconComponent = resolveSvgComponent(MessageIcon);

const ResetPassword: React.FC = ({navigation}: any) => {
	const [loading, setLoading] = useState(false);
	const [resetSent, setResetSent] = useState(false);

	const validationSchema = yup.object({
		email: yup.string().email('Invalid email').required('Email is required'),
	});

	const handleNext = async (values: any) => {
		if (values.email) {
			setLoading(true);
			try {
				const userQuery = await firestore()
					.collection('Users')
					.where('email', '==', values.email)
					.get();

				if (!userQuery.empty) {
					await auth().sendPasswordResetEmail(values.email);
					showToast({
						type: 'success',
						title: 'Success',
						message: 'Reset password link sent to your email.',
					});
					setResetSent(true);
				} else {
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
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<StatusBar
					barStyle={'light-content'}
					translucent
					backgroundColor="transparent"
				/>

				<View style={styles.container}>
					<View style={styles.topSection}>
						<View style={styles.topPattern}>
							<GroupComponent
								width={screenWidth + RFPercentage(10)}
								height={RFPercentage(26)}
								style={styles.groupSvg}
							/>
						</View>

						<Image source={IMAGES.logo} resizeMode="contain" style={styles.logo} />
					</View>

					<View style={styles.formSheet}>
						<KeyboardAwareScrollView
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.formScrollContent}
							enableOnAndroid
							extraHeight={Platform.OS === 'ios' ? 80 : 120}
							extraScrollHeight={Platform.OS === 'ios' ? 24 : 40}
							keyboardOpeningTime={0}>
							<View style={styles.formHeaderRow}>
								<TouchableOpacity
									activeOpacity={0.8}
									style={styles.backButton}
									onPress={() =>
										navigation.canGoBack()
											? navigation.goBack()
											: navigation.navigate('SignIn')
									}>
									<BackarrowComponent
										width={RFPercentage(2)}
										height={RFPercentage(2)}
									/>
								</TouchableOpacity>

								<Text style={styles.heading}>Reset Password</Text>
							</View>

							<View style={styles.copyBlock}>
								{/* <Text style={styles.copyTitle}>Forget password</Text> */}
								<Text style={styles.copyText}>
									Enter your email address and we'll send you a link to reset
									your password.
								</Text>
							</View>

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
										<View style={styles.fieldBlock}>
											<View style={styles.labelRow}>
												<View style={styles.labelIconWrap}>
															<MessageIconComponent
																width={RFPercentage(2.15)}
																height={RFPercentage(2.15)}
															/>
												</View>
												<Text style={styles.labelText}>Email Address</Text>
											</View>

											<View
												style={[
													styles.inputContainer,
													touched.email && errors.email && styles.inputError,
												]}>
												<TextInput
													placeholder="Email"
													placeholderTextColor={Colors.placeholderColor}
													onChangeText={handleChange('email')}
													onBlur={handleBlur('email')}
													value={values.email}
													autoCapitalize="none"
													autoCorrect={false}
													keyboardType="email-address"
												style={[
													styles.inputText,
													!values.email && styles.inputPlaceholderText,
												]}
												/>
											</View>

											{touched.email && errors.email ? (
												<Text style={styles.errorText}>{errors.email}</Text>
											) : null}
										</View>

										<View style={styles.buttonContainer}>
											<GradientButton
												title="Send Reset Link"
												onPress={() => handleSubmit()}
												loading={loading}
												disabled={loading}
												style={styles.resetButton}
												textStyle={styles.resetButtonText}
											/>
										</View>

										<View style={styles.bottomContainer}>
											<Text style={styles.bottomText}>Don't have an account?</Text>
											<TouchableOpacity
												activeOpacity={0.8}
												onPress={() => navigation.navigate('UserSelection')}>
												<Text style={styles.signUpText}>Signup</Text>
											</TouchableOpacity>
										</View>

										{resetSent ? (
											<View style={styles.successCard}>
												<View style={styles.successHeader}>
													<MaterialCommunityIcons
														name="check-circle"
														size={RFPercentage(2.6)}
														color={Colors.success}
													/>
													<Text style={styles.successTitle}>Reset Link Sent</Text>
												</View>
												<Text style={styles.successText}>
													We've sent you a password reset link. If it doesn't
													appear in your inbox within a few minutes, please also
													check your Spam or Junk folder.
												</Text>
												<TouchableOpacity
													activeOpacity={0.8}
													onPress={() => navigation.navigate('SignIn')}
													style={styles.backToLoginButton}>
													<Text style={styles.backToLoginText}>
														Back to Login
													</Text>
												</TouchableOpacity>
											</View>
										) : null}
									</>
								)}
							</Formik>

							<View style={styles.securityNote}>
								<MaterialCommunityIcons
									name="shield-check"
									size={RFPercentage(2)}
									color={Colors.secondaryText}
									style={styles.securityIcon}
								/>
								<Text style={styles.securityText}>
									Your email is secure. Password reset instructions are sent
									only to verified accounts.
								</Text>
							</View>
						</KeyboardAwareScrollView>
					</View>

					<View style={styles.starContainer} pointerEvents="none">
						<BlueStarsComponent style={styles.star} />
					</View>
				</View>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
};

export default ResetPassword;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#407BFF',
	},
	container: {
		flex: 1,
		backgroundColor: '#407BFF',
	},
	topSection: {
		height: RFPercentage(25.5),
		backgroundColor: '#407BFF',
		borderBottomLeftRadius: RFPercentage(4),
		borderBottomRightRadius: RFPercentage(4),
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	topPattern: {
		...StyleSheet.absoluteFillObject,
		opacity: 0.06,
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	groupSvg: {
		marginTop: RFPercentage(-3),
	},
	logo: {
		width: RFPercentage(22.5),
		height: RFPercentage(8),
		marginTop: RFPercentage(-7.5),
		tintColor: Colors.white,
	},
	formSheet: {
		flex: 1,
		marginTop: RFPercentage(-7),
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: RFPercentage(4),
		borderTopRightRadius: RFPercentage(4),
		paddingTop: RFPercentage(2.4),
		paddingHorizontal: RFPercentage(2.4),
	},
	formScrollContent: {
		flexGrow: 1,
		paddingBottom: RFPercentage(5),
	},
	formHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: RFPercentage(1.4),
	},
	backButton: {
		width: RFPercentage(4.2),
		height: RFPercentage(4.2),
		borderRadius: RFPercentage(2.7),
		backgroundColor: 'rgba(160, 160, 160, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: RFPercentage(1.8),
	},
	heading: {
		color: '#1E1E1E',
		fontFamily: Fonts.fontMedium,
		fontSize: RFPercentage(2.05),
		marginLeft: RFPercentage(-0.25),
	},
	copyBlock: {
		// marginTop: RFPercentage(1.4),
		marginBottom: RFPercentage(1.9),
	},
	copyTitle: {
		color: '#1E1E1E',
		fontFamily: Fonts.fontMedium,
		fontSize: RFPercentage(2.02),
	},
	copyText: {
		color: '#6B7280',
		fontSize: RFPercentage(1.62),
		fontFamily: Fonts.fontRegular,
		lineHeight: RFPercentage(2.3),
		marginTop: RFPercentage(1.3),
		paddingRight: RFPercentage(1),
	},
	fieldBlock: {
		marginTop: RFPercentage(0.9),
	},
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: RFPercentage(1.6),
	},
	labelIconWrap: {
		width: RFPercentage(4.1),
		height: RFPercentage(4.1),
		borderRadius: RFPercentage(1.2),
		backgroundColor: 'rgba(64, 123, 255, 0.12)',
		borderWidth: RFPercentage(0.12),
		borderColor: 'rgba(64, 123, 255, 0.24)',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: RFPercentage(1.1),
	},
	labelText: {
		color: '#1E1E1E',
		fontSize: RFPercentage(1.82),
		fontFamily: Fonts.fontMedium,
	},
	inputContainer: {
		height: RFPercentage(7),
		borderWidth: RFPercentage(0.14),
		borderColor: '#E5E7EB',
		borderRadius: RFPercentage(2.1),
		paddingHorizontal: RFPercentage(2.2),
		backgroundColor: Colors.white,
		justifyContent: 'center',
	},
	inputText: {
		fontSize: RFPercentage(1.8),
		fontFamily: Fonts.fontRegular,
		color: Colors.inputTextColor,
		paddingVertical: 0,
	},
	inputPlaceholderText: {
		fontSize: RFPercentage(1.65),
	},
	inputError: {
		borderColor: Colors.error,
	},
	errorText: {
		color: Colors.error,
		fontSize: RFPercentage(1.5),
		fontFamily: Fonts.fontRegular,
		marginTop: RFPercentage(0.55),
		marginLeft: RFPercentage(0.45),
	},
	buttonContainer: {
		marginTop: RFPercentage(2),
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	resetButton: {
		width: '100%',
		height: RFPercentage(6.8),
		borderRadius: RFPercentage(5),
	},
	resetButtonText: {
		fontSize: RFPercentage(2),
		fontFamily: Fonts.fontMedium,
	},
	bottomContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: RFPercentage(3),
	},
	bottomText: {
		color: Colors.secondaryText,
		fontSize: RFPercentage(1.50),
		fontFamily: Fonts.fontRegular,
	},
	signUpText: {
		color: Colors.gradient1,
		fontSize: RFPercentage(1.50),
		fontFamily: Fonts.fontMedium,
		marginLeft: RFPercentage(0.55),
	},
	successCard: {
		marginTop: RFPercentage(1.7),
		backgroundColor: Colors.successBg,
		borderRadius: RFPercentage(2),
		paddingHorizontal: RFPercentage(1.8),
		paddingVertical: RFPercentage(2),
		borderWidth: RFPercentage(0.12),
		borderColor: Colors.successBorder,
	},
	successHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	successTitle: {
		marginLeft: RFPercentage(0.8),
		color: Colors.successText,
		fontSize: RFPercentage(1.9),
		fontFamily: Fonts.fontMedium,
	},
	successText: {
		marginTop: RFPercentage(1.1),
		color: Colors.successText,
		fontSize: RFPercentage(1.55),
		fontFamily: Fonts.fontRegular,
		lineHeight: RFPercentage(2.15),
	},
	backToLoginButton: {
		alignSelf: 'flex-start',
		marginTop: RFPercentage(1.6),
		paddingVertical: RFPercentage(0.5),
	},
	backToLoginText: {
		color: Colors.gradient1,
		fontSize: RFPercentage(1.65),
		fontFamily: Fonts.fontMedium,
	},
	securityNote: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#F3F4F6',
		borderRadius: RFPercentage(2),
		paddingHorizontal: RFPercentage(1.8),
		paddingVertical: RFPercentage(2),
		marginTop: RFPercentage(1.8),
		marginBottom: RFPercentage(1.5),
	},
	securityIcon: {
		marginTop: RFPercentage(0.15),
		marginRight: RFPercentage(1.1),
	},
	securityText: {
		flex: 1,
		color: Colors.secondaryText,
		fontSize: RFPercentage(1.4),
		fontFamily: Fonts.fontRegular,
		lineHeight: RFPercentage(2.1),
	},
	starContainer: {
		position: 'absolute',
		right: RFPercentage(0.9),
		bottom: RFPercentage(2),
		opacity: 0.18,
	},
	star: {
		width: RFPercentage(9),
		height: RFPercentage(9),
	},
});
