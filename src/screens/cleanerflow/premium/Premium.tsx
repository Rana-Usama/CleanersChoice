import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import HeaderComponent from '../../../components/HeaderComponent';
import GradientButton from '../../../components/GradientButton';
import {useStripe} from '@stripe/stripe-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SubscriptionModal from '../../../components/SubscriptionModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {showToast} from '../../../utils/ToastMessage';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as RNIap from 'react-native-iap';
import {useAppleIAP} from '../../../hooks/useAppleIAP';

const {width} = Dimensions.get('window');

const services = [
  {id: 1, name: 'Connect with cleaning customers'},
  {id: 2, name: 'See unlimited Job Listings'},
  {id: 3, name: 'List your services'},
  {id: 4, name: 'Cancel any time'},
];

const productId = 'cleaner.premium.monthly.V1';
const PRIVACY_URL =
  'https://www.privacypolicies.com/live/9ed1413e-3736-4e66-8b11-61ea197e4e37';
const EULA_URL =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const Premium = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [currentUser, setCurrentUser] =
    useState<FirebaseFirestoreTypes.DocumentData | null>(null);

  const user = auth().currentUser;

  // Fetching user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        try {
          const querySnapshot = await firestore()
            .collection('Users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setCurrentUser(userData);
          }
        } catch (error) {}
      }
    };

    fetchUserData();
  }, [user?.email]);

  const {productPrice, iapLoading, purchaseWithApple} = useAppleIAP(
    // onSuccess callback
    () => {
      showToast({
        type: 'success',
        title: 'Subscription',
        message: 'Subscription activated successfully!',
      });
      navigation.navigate('CleanerNavigator');
    },
    // onError callback
    (msg: string) => {
      showToast({
        type: 'error',
        title: 'Purchase Failed',
        message: msg,
      });
    },
  );

  const handleSubscribe = async () => {
    if (Platform.OS === 'ios') {
      await purchaseWithApple(); // ← Apple IAP for iOS
    } else {
      await openPaymentSheet(); // ← Stripe for Android
    }
  };

  // Fetching payment intent
  const fetchSetupIntent = async () => {
    try {
      const response = await fetch(
        'https://cleaners-choice-server.vercel.app/api/create-subscription',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: user?.email, uid: user?.uid}),
        },
      );

      console.log('sheet..............', response);
      const {setupIntentClientSecret, customerId} = await response.json();

      if (!setupIntentClientSecret || !customerId) {
        throw new Error('Missing client secret or customer ID');
      }
      return {setupIntentClientSecret, customerId};
    } catch (error) {
      Alert.alert('Error', 'Could not create customer. Please try again.');
      return null;
    }
  };

  // Open payment sheet
  const openPaymentSheet = async () => {
    setLoading(true);
    const setupData = await fetchSetupIntent();
    if (!setupData) return;
    const {setupIntentClientSecret, customerId} = setupData;

    const {error: initError} = await initPaymentSheet({
      setupIntentClientSecret,
      merchantDisplayName: 'Cleaner Choice',
    });

    if (initError) {
      setLoading(false);
      return;
    }

    const {error: paymentError} = await presentPaymentSheet();

    if (paymentError) {
      let userFriendlyMessage = 'The payment flow has been canceled';
      if (paymentError.message?.toLowerCase().includes('insufficient funds')) {
        userFriendlyMessage =
          'Your card has insufficient funds. Please use a different card or try again after adding funds.';
      }

      showToast({
        type: 'info',
        title: 'Subscription',
        message: userFriendlyMessage,
      });
      setLoading(false);
      return;
    }

    const setupIntentId = setupIntentClientSecret.split('_secret')[0];
    console.log(
      'Sending setupIntentId to confirm-subscription:',
      setupIntentId,
    );
    const res = await fetch(
      'https://cleaners-choice-server.vercel.app/api/confirm-subscription',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({customerId, setupIntentId}),
      },
    );

    const result = await res.json();
    if (result.success && result.subscriptionStatus === 'active') {
      const {periodEndTimestamp} = result;

      if (user?.uid) {
        await firestore().collection('Users').doc(user.uid).update({
          subscription: true,
          subscriptionProvider: 'stripe',
          subscriptionId: result.subscriptionId,
          cancelSubscription: false,
          subscriptionEndDate: periodEndTimestamp,
        });
      }
      showToast({
        type: 'success',
        title: 'Subscription',
        message: 'Subscription has been purchased successfully!',
      });
      navigation.navigate('CleanerNavigator');
    } else {
      showToast({
        type: 'info',
        title: 'Subscription',
        message: result.message || 'Subscription has not been fulfilled!',
      });
      setModalVisible2(true);
    }
  };

  const endDate = currentUser?.subscriptionEndDate;
  const hasEndDate = typeof endDate === 'number' && endDate > 0;
  const isExpired = hasEndDate && endDate < Date.now();
  const showRenewUI = hasEndDate && isExpired;

  const getButtonTitle = () => {
    if (showRenewUI) return 'Renew Subscription';
    if (Platform.OS === 'ios') return `Subscribe ${productPrice}/mo`;
    return 'Proceed To Payment';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <HeaderComponent />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {showRenewUI ? (
            <>
              <Text style={styles.premiumTitle}>Renew Premium Account</Text>
              <Text style={styles.premiumSubtitle}>
                Continue growing your cleaning business with premium features
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.premiumTitle}>Premium Business Account</Text>
              <Text style={styles.premiumSubtitle}>
                Unlock premium features to grow your cleaning business
              </Text>
            </>
          )}
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          {/* Badge */}
          <View style={styles.popularBadge}>
            <MaterialCommunityIcons
              name="star"
              size={RFPercentage(1.6)}
              color={Colors.white}
            />
            <Text style={styles.popularText}>Standard Plan</Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            {Platform.OS === 'ios' ? (
              <Text style={styles.priceText}>{productPrice}</Text>
            ) : (
              <Text style={styles.priceText}>
                $20
                <Text style={styles.priceDecimal}>.99</Text>
              </Text>
            )}
            <Text style={styles.pricePeriod}>per month</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Premium Features</Text>

            <FlatList
              scrollEnabled={false}
              data={services}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={RFPercentage(2.2)}
                    color={Colors.success}
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{item.name}</Text>
                </View>
              )}
            />
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={RFPercentage(2)}
                color={Colors.success}
              />
              <Text style={styles.trustText}>Secure Payment</Text>
            </View>
            <View style={styles.trustItem}>
              <MaterialCommunityIcons
                name="cancel"
                size={RFPercentage(2)}
                color={Colors.gradient1}
              />
              <Text style={styles.trustText}>Cancel Anytime</Text>
            </View>
          </View>
        </View>

        {/* Legal Links - iOS only (App Store requirement) */}
        {Platform.OS === 'ios' && (
          <View style={styles.legalLinks}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy{`\n`}
              </Text>{' '}
              and{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL(EULA_URL)}>
                Terms of Use
              </Text>
              .
            </Text>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Action Section */}
      <View style={[styles.actionSection, {paddingBottom: insets.bottom + RFPercentage(0.5)}]}>
        <View style={styles.actionContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.8}
            style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Back</Text>
          </TouchableOpacity>

          <GradientButton
            title={getButtonTitle()}
            textStyle={styles.buttonText}
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            loading={loading}
            disabled={loading}
          />
        </View>

        {/* <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SignIn')}
          style={styles.signInButton}>
          <Ionicons
            name="chevron-back"
            color={Colors.gradient1}
            size={RFPercentage(2)}
          />
          <Text style={styles.signInText}>Back to Sign In</Text>
        </TouchableOpacity> */}
      </View>

      {/* Stars Decoration */}
      <View style={styles.starContainer}>
        <Image source={IMAGES.stars} resizeMode="contain" style={styles.star} />
      </View>

      {/* Modals */}
      {modalVisible2 && (
        <View style={styles.modalOverlay}>
          <SubscriptionModal
            text="Subscription Failed Try again."
            icon="exclamationcircle"
            onPress={() => {
              setModalVisible2(false), setLoading(false);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Premium;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(15),
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(4),
  },
  premiumBadge: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    backgroundColor: Colors.amberOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(2),
    borderWidth: 2,
    borderColor: Colors.amberOverlay20,
  },
  premiumTitle: {
    color: Colors.brown,
    fontSize: RFPercentage(2.6),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginBottom: RFPercentage(1),
  },
  premiumSubtitle: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
    paddingHorizontal: RFPercentage(4),
  },
  pricingCard: {
    backgroundColor: Colors.white,
    marginHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
    position: 'relative',
    marginBottom: RFPercentage(2),
  },
  popularBadge: {
    position: 'absolute',
    top: RFPercentage(-1),
    alignSelf: 'center',
    backgroundColor: Colors.gradient1,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  popularText: {
    color: Colors.white,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  priceSection: {
    alignItems: 'center',
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  priceText: {
    color: Colors.brown,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(4.6),
  },
  priceDecimal: {
    fontSize: RFPercentage(2.6),
    fontFamily: Fonts.fontMedium,
  },
  pricePeriod: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.5),
  },
  featuresContainer: {
    marginVertical: RFPercentage(1),
  },
  featuresTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.5),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(1),
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay50,
  },
  featureIcon: {
    marginRight: RFPercentage(1.5),
  },
  featureText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    flex: 1,
  },
  trustContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RFPercentage(2),
    paddingTop: RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay80,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
    marginTop: RFPercentage(0.5),
  },
  statsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
    marginBottom: RFPercentage(2),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: RFPercentage(4),
    backgroundColor: Colors.grayBorderOverlay80,
  },
  statNumber: {
    color: Colors.gradient1,
    fontSize: RFPercentage(2.3),
    fontFamily: Fonts.fontBold,
    marginBottom: RFPercentage(0.3),
  },
  statLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
  },
  testimonialCard: {
    backgroundColor: Colors.testimonialBg,
    marginHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.testimonialBorder,
    marginBottom: RFPercentage(2),
  },
  quoteIcon: {
    position: 'absolute',
    top: RFPercentage(1),
    left: RFPercentage(1),
  },
  testimonialText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    fontStyle: 'italic',
    lineHeight: RFPercentage(2.4),
    marginBottom: RFPercentage(1.5),
    textAlign: 'center',
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(1),
  },
  authorInfo: {
    alignItems: 'flex-start',
  },
  authorName: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  authorRole: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
  },
  spacer: {
    height: RFPercentage(2),
  },
  actionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: RFPercentage(2),
    paddingBottom: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1.5),
  },
  totalContainer: {
    flex: 1,
    borderWidth: 1,
    height: RFPercentage(5.5),
    borderColor: Colors.gradient1,
    borderRadius: RFPercentage(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
  totalPrice: {
    color: Colors.gradient1,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.fontBold,
  },
  subscribeButton: {
    flex: 2,
    borderRadius: RFPercentage(2),
  },
  buttonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.5),
    paddingVertical: RFPercentage(1),
  },
  signInText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  starContainer: {
    position: 'absolute',
    right: RFPercentage(1.5),
    bottom: RFPercentage(15),
    opacity: 0.3,
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
  modalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.darkOverlay80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLinks: {
    paddingHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  legalText: {
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    fontFamily: Fonts.fontRegular,
  },
  link: {
    color: Colors.gradient1,
    textDecorationLine: 'underline',
  },
});
