import {
	Image,
	Modal,
	StatusBar,
	StyleSheet,
	Text,
	View,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Keyboard,
	TextInput,
	Dimensions,
	ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSoftInputAdjustNothing} from '../../../hooks/useSoftInputMode';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import GradientButton from '../../../components/GradientButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../utils/ToastMessage';
import firestore from '@react-native-firebase/firestore';
import Group from '../../../assets/svg/Group';
import Backarrow from '../../../assets/svg/Backarrow';
import BlueStars from '../../../assets/svg/BlueStars';
import MessageIcon from '../../../assets/svg/messageicon';
import SmsIcon from '../../../assets/svg/smsIcon';

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
const SmsIconComponent = resolveSvgComponent(SmsIcon);
const starsImage = require('../../../assets/images/Starsss.webp');

const ResetPassword: React.FC = ({navigation}: any) => {
	const [loading, setLoading] = useState(false);
	const [resetSent, setResetSent] = useState(false);
	useSoftInputAdjustNothing();

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

						<View style={styles.topStarContainer} pointerEvents="none">
							<Image
								source={starsImage}
								resizeMode="contain"
								style={styles.topStar}
							/>
						</View>

						<Image source={IMAGES.logo} resizeMode="contain" style={styles.logo} />
					</View>

					<KeyboardAvoidingView
						style={styles.formSheet}
						behavior={Platform.OS === 'android' ? 'height' : undefined}>
						<ScrollView
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="on-drag"
							overScrollMode="never"
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.formScrollContent}>
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

								<Text style={styles.heading}>Forget Password</Text>
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

									</>
								)}
							</Formik>
						</ScrollView>
					</KeyboardAvoidingView>

					<View style={styles.starContainer} pointerEvents="none">
						<BlueStarsComponent style={styles.star} />
					</View>
				</View>

				<Modal
					visible={resetSent}
					transparent
					animationType="fade"
					statusBarTranslucent
					onRequestClose={() => setResetSent(false)}>
					<View style={styles.successModalOverlay}>
						<View style={styles.successModalCard}>
							<View style={styles.successModalIconWrap}>
								<SmsIconComponent
									width={RFPercentage(4)}
									height={RFPercentage(4)}
								/>
							</View>

							<Text style={styles.successModalTitle}>Check Your Email</Text>

							<Text style={styles.successModalText}>
								Password reset instructions sent to your email. Check your inbox to continue.
							</Text>

							<View style={styles.successModalActions}>
								<TouchableOpacity
									activeOpacity={0.85}
									onPress={() => setResetSent(false)}
									style={styles.successModalCloseButton}>
									<Text style={styles.successModalCloseText}>Close</Text>
								</TouchableOpacity>

								<TouchableOpacity
									activeOpacity={0.9}
									onPress={() => {
										setResetSent(false);
										navigation.navigate('SignIn');
									}}
									style={styles.successModalLoginButton}>
									<Text style={styles.successModalLoginText}>Back to Login</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
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
		paddingBottom: RFPercentage(2.5),
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
		marginTop: RFPercentage(-2.4),
		marginBottom: RFPercentage(3),
		paddingLeft: RFPercentage(5.75),
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
		width: RFPercentage(3),
		height: RFPercentage(3),
		borderRadius: RFPercentage(0.7),
		backgroundColor: 'rgba(77, 133, 254, 0.15)',
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
		marginTop: RFPercentage(3.5),
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
	successModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(20, 28, 45, 0.38)',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: RFPercentage(2.3),
	},
	successModalCard: {
		width: '100%',
		maxWidth: RFPercentage(38),
		backgroundColor: Colors.white,
		borderRadius: RFPercentage(2.4),
		paddingHorizontal: RFPercentage(2.3),
		paddingTop: RFPercentage(2.5),
		paddingBottom: RFPercentage(2.3),
		alignItems: 'center',
	},
	successModalIconWrap: {
		marginBottom: RFPercentage(1.1),
	},
	successModalTitle: {
		color: '#475569',
		fontSize: RFPercentage(2),
		fontFamily: Fonts.fontMedium,
		textAlign: 'center',
	},
	successModalText: {
		marginTop: RFPercentage(1.7),
		color: '#64748B',
		fontSize: RFPercentage(1.7),
		lineHeight: RFPercentage(2.5),
		fontFamily: Fonts.fontRegular,
		textAlign: 'center',
		paddingHorizontal: RFPercentage(0.8),
	},
	successModalActions: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: RFPercentage(2.6),
	},
	successModalCloseButton: {
		flex: 1,
		height: RFPercentage(4.7),
		borderRadius: RFPercentage(4),
		borderWidth: RFPercentage(0.14),
		borderColor: '#A5A9B0',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: RFPercentage(1),
		backgroundColor: Colors.white,
	},
	successModalCloseText: {
		color: '#A5A9B0',
		fontSize: RFPercentage(1.6),
		fontFamily: Fonts.fontMedium,
	},
	successModalLoginButton: {
		flex: 1,
		height: RFPercentage(4.7),
		borderRadius: RFPercentage(4),
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: RFPercentage(1),
		backgroundColor: Colors.gradient1,
	},
	successModalLoginText: {
		color: Colors.white,
		fontSize: RFPercentage(1.6),
		fontFamily: Fonts.fontMedium,
	},
	topStarContainer: {
		position: 'absolute',
		left: RFPercentage(1.4),
		top: RFPercentage(0),
		zIndex: 1,
	},
	topStar: {
		width: RFPercentage(7.5),
		height: RFPercentage(7.5),
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
