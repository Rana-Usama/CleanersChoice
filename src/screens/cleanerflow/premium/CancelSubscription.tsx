import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import HeaderComponent from '../../../components/HeaderComponent';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {BlurView} from '@react-native-community/blur';
import SubscriptionModal from '../../../components/SubscriptionModal';
import NextButton from '../../../components/NextButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {showToast} from '../../../utils/ToastMessage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const services = [
  {id: 1, name: 'Connect with cleaning customers'},
  {id: 2, name: 'See unlimited Job Listings'},
  {id: 3, name: 'List your services'},
  {id: 4, name: 'Cancel any time'},
];

const CancelSubscription = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [cancel, setCancel] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [subscriptionProvider, setSubscriptionProvider] = useState<string | null>(null);
  const user = auth().currentUser;

  const isApple = subscriptionProvider === 'apple';

  // Fetching user data
  useEffect(() => {
    const fetchSubscriptionId = async () => {
      if (user?.uid) {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        const userData = userDoc.data();
        setSubscriptionId(userData?.subscriptionId);
        setCancel(userData?.cancelSubscription);
        setSubscriptionProvider(userData?.subscriptionProvider || null);
      }
    };

    fetchSubscriptionId();
  }, [user?.uid]);

  // Cancel subscription — branches on provider
  const cancelSubscription = async () => {
    if (isApple) {
      // Apple: open App Store subscription management
      Linking.openURL('https://apps.apple.com/account/subscriptions');
      showToast({
        type: 'info',
        title: 'Manage Subscription',
        message: 'Manage your subscription in the App Store.',
      });
      navigation.goBack();
      return;
    }

    // Stripe flow
    if (!subscriptionId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No active subscription found.',
      });
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(
        'https://cleaners-choice-server.vercel.app/api/cancel-subscription',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subscriptionId}),
        },
      );
      const text = await res.text();
      try {
        const result = JSON.parse(text);
        if (result.success) {
          const {currentPeriodEnd} = result;
          if (user?.uid) {
            await firestore()
              .collection('Users')
              .doc(user.uid)
              .update({
                subscription: true,
                subscriptionEndDate: currentPeriodEnd * 1000,
                subscriptionId: subscriptionId,
                cancelSubscription: true,
              });
          }
          showToast({
            type: 'success',
            title: 'Cancel Subscription',
            message: 'Subscription has been canceled successfully!',
          });
          navigation.goBack();
        } else {
          setModalVisible2(true);
        }
      } catch (err) {
        setModalVisible2(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {/* Header */}
      <HeaderComponent />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Main Container */}
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={styles.warningBadge}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={RFPercentage(1.5)}
                  color={Colors.red500}
                />
              </View>
              <Text style={styles.titleText}>Cancel Premium Subscription</Text>
            </View>
            <Text style={styles.subtitleText}>
              Are you sure you want to cancel your premium subscription?
            </Text>
          </View>

          {/* Current Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.currentBadge}>
              <MaterialCommunityIcons
                name="crown"
                size={RFPercentage(1.6)}
                color={Colors.white}
              />
              <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
            </View>

            <View style={styles.planContent}>
              <Text style={styles.planName}>Premium Business Account</Text>
              <View style={styles.priceSection}>
                <Text style={styles.priceText}>
                  $15
                  <Text style={styles.priceDecimal}>.99</Text>
                </Text>
                <Text style={styles.pricePeriod}>per month</Text>
              </View>
            </View>
          </View>

          {/* Features Card */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Premium Features</Text>
            <FlatList
              data={services}
              scrollEnabled={false}
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

          {/* Warning Note */}
          <View style={styles.warningNote}>
            <MaterialCommunityIcons
              name="information"
              size={RFPercentage(2.5)}
              color={Colors.amber500}
              style={styles.warningIcon}
            />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Important Notice</Text>
              <Text style={styles.warningText}>
                You will lose access to all premium features after your current
                billing cycle ends.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <GradientButton
              title={
                cancel === true
                  ? 'Subscription Canceled'
                  : 'Cancel Subscription'
              }
              textStyle={styles.cancelButtonText}
              onPress={() => setModalVisible(true)}
              style={styles.cancelButton}
              loading={isLoading}
              disabled={isLoading || cancel === true}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                color={Colors.gradient1}
                size={RFPercentage(2)}
              />
              <Text style={styles.backButtonText}>Keep Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Star */}
        <View style={styles.starContainer}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={styles.star}
          />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <View style={styles.confirmationModal}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={RFPercentage(4)}
                  color={Colors.red500}
                />
                <Text style={styles.modalTitle}>Confirm Cancellation</Text>
              </View>

              {/* Warning Content */}
              <View style={styles.warningList}>
                <Text style={styles.warningListTitle}>
                  You'll lose access to:
                </Text>

                <View style={styles.warningItem}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={RFPercentage(2)}
                    color={Colors.red500}
                  />
                  <Text style={styles.warningItemText}>
                    Access to the Job Portal
                  </Text>
                </View>

                <View style={styles.warningItem}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={RFPercentage(2)}
                    color={Colors.red500}
                  />
                  <Text style={styles.warningItemText}>
                    Chat with customers feature
                  </Text>
                </View>

                <View style={styles.warningItem}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={RFPercentage(2)}
                    color={Colors.red500}
                  />
                  <Text style={styles.warningItemText}>
                    All premium features until reactivation
                  </Text>
                </View>
              </View>

              <Text style={styles.modalNote}>
                {isApple
                  ? 'You will be redirected to the App Store to manage your subscription.'
                  : 'Your subscription will remain active until the end of the current billing period.'}
              </Text>

              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <NextButton
                  title="Keep Premium"
                  style={styles.modalCancelButton}
                  textStyle={styles.modalCancelButtonText}
                  onPress={() => setModalVisible(false)}
                />
                <GradientButton
                  title="Cancel"
                  onPress={() => {
                    setIsLoading2(true);
                    setTimeout(() => {
                      setIsLoading2(false);
                      cancelSubscription();
                      setModalVisible(false);
                    }, 1000);
                  }}
                  style={styles.modalConfirmButton}
                  loading={isLoading2}
                  disabled={isLoading2}
                  textStyle={{fontSize: RFPercentage(1.7)}}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Error Modal */}
      {modalVisible2 && (
        <View style={styles.errorModalOverlay}>
          <SubscriptionModal
            text="Failed. Please try again."
            icon="exclamationcircle"
            onPress={() => setModalVisible2(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default CancelSubscription;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(20),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(2),
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: RFPercentage(3),
  },
  warningBadge: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(4),
    backgroundColor: Colors.redOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.redOverlay20,
    right:RFPercentage(1)
  },
  titleText: {
    color: Colors.brown,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
   
  },
  subtitleText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
    paddingHorizontal: RFPercentage(2),
    marginTop:RFPercentage(1)
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
    position: 'relative',
  },
  currentBadge: {
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
  currentBadgeText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontMedium,
  },
  planContent: {
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  planName: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(1.5),
  },
  priceSection: {
    alignItems: 'center',
  },
  priceText: {
    color: Colors.brown,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(3.6),
  },
  priceDecimal: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.fontMedium,
  },
  pricePeriod: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.5),
  },
  featuresCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
  },
  featuresTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(1.5),
    paddingBottom: RFPercentage(1),
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay80,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(1),
    borderBottomWidth: 1,
    borderBottomColor: Colors.zincBorder,
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
  warningNote: {
    backgroundColor: Colors.amberOverlay10,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(3),
    borderWidth: 1,
    borderColor: Colors.amberOverlay20,
  },
  warningIcon: {
    marginRight: RFPercentage(1.5),
    marginTop: RFPercentage(0.2),
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: Colors.amberDarkText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(0.5),
  },
  warningText: {
    color: Colors.amberDarkText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    lineHeight: RFPercentage(2),
  },
  actionContainer: {
    alignItems: 'center',
  },
  cancelButton: {
    width: '60%',
    marginBottom: RFPercentage(2),
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.5),
    paddingVertical: RFPercentage(1),
  },
  backButtonText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  starContainer: {
    position: 'absolute',
    right: RFPercentage(1),
    bottom: RFPercentage(15),
    opacity: 0.2,
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  confirmationModal: {
    width: '90%',
    borderRadius: RFPercentage(2),
    backgroundColor: Colors.white,
    alignSelf: 'center',
    position: 'absolute',
    paddingHorizontal: RFPercentage(3.5),
    paddingVertical: RFPercentage(3),
    top: RFPercentage(20),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: RFPercentage(2),
  },
  modalTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
  warningList: {
    marginBottom: RFPercentage(2),
  },
  warningListTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    marginBottom: RFPercentage(1.5),
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(1.2),
    gap: RFPercentage(1),
  },
  warningItemText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    flex: 1,
    lineHeight: RFPercentage(2),
  },
  modalNote: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(1),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RFPercentage(1.5),
  },
  modalCancelButton: {
   width:RFPercentage(16),
    backgroundColor: Colors.white,
    borderWidth: 1.2,
    borderColor: Colors.modalBorderGray,
  },
  modalCancelButtonText: {
    color: Colors.modalTextGray,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
  },
  modalConfirmButton: {
    flex: 2,
  },
  errorModalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.darkOverlay80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
