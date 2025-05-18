import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
  StatusBar,
  TouchableOpacity,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionModal from '../../../components/SubscriptionModal';
import Toast from 'react-native-toast-message';
import NextButton from '../../../components/NextButton';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {showToast} from '../../../utils/ToastMessage';

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
  const [modalVisible3, setModalVisible3] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isLoading3, setIsLoading3] = useState(false);
  const [cancel, setCancel] = useState(null);

  const [subscriptionId, setSubscriptionId] = useState(null);
  const user = auth().currentUser;

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
      }
    };

    fetchSubscriptionId();
  }, [user?.uid]);

  const cancelSubscription = async () => {
    if (!subscriptionId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No active subscription found.',
      });
      return;
    }

    try {
      setIsLoading(true); // Start loader

      const res = await fetch(
        'https://cleaners-choice-server.vercel.app/api/cancel-subscription',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subscriptionId}),
        },
      );

      const text = await res.text(); // Read as text first
      try {
        const result = JSON.parse(text); // Try parsing manually
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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: RFPercentage(7),
          left: RFPercentage(3),
        }}>
        <AntDesign
          name="arrowleft"
          color={Colors.secondaryText}
          size={RFPercentage(3)}
        />
      </TouchableOpacity>
      <HeaderComponent />
      <View style={styles.container}>
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumText}>Cancel Premium Subscription</Text>
        </View>

        <View style={styles.subscriptionContainer}>
          <View style={styles.subscriptionBox}>
            <View style={styles.starLeft}>
              <Image
                source={IMAGES.stars}
                resizeMode="contain"
                style={styles.starIcon}
              />
            </View>
            <View>
              <Text
                style={{
                  textAlign: 'center',
                  bottom: 2,
                  fontFamily: Fonts.fontMedium,
                  color: Colors.brown,
                  fontSize: RFPercentage(1.5),
                }}>
                Current Plan
              </Text>
            </View>
            <Text style={styles.priceText}>
              $12.
              <Text style={styles.priceSubText}>99/month</Text>
            </Text>
            <View style={styles.divider}>
              <View style={styles.listContainer}>
                <FlatList
                  data={services}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({item}) => (
                    <View style={styles.listItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.listText}>{item.name}</Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.starRight}>
                <Image
                  source={IMAGES.stars}
                  resizeMode="contain"
                  style={styles.starIcon}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <GradientButton
            title={cancel === true ? 'Canceled' : 'Cancel'}
            textStyle={styles.buttonText}
            onPress={() => setModalVisible(true)}
            style={{width: RFPercentage(18)}}
            loading={isLoading}
            disabled={isLoading || cancel === true ? true : false}
          />
        </View>
      </View>

      <View style={styles.starContainer}>
        <Image source={IMAGES.stars} resizeMode="contain" style={styles.star} />
      </View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={2} />
            <View style={styles.modalCancel}>
              <Text style={styles.cancelHeading}>
                You’ll loose access to all premium features after one month that
                includes:
              </Text>
              <View
                style={{
                  marginVertical: RFPercentage(5),
                  width: RFPercentage(32),
                }}>
                <Text style={styles.cancelInfo}>
                  {`1. Access to Job Portal.`}
                </Text>
                <Text
                  style={[
                    styles.cancelInfo,
                    {marginVertical: RFPercentage(2)},
                  ]}>
                  {`2. You won’t be able to chat with Customers.`}
                </Text>
                <Text style={styles.cancelInfo}>
                  {`3. You’ll have to active your subscription again to use the app.`}
                </Text>
              </View>
              <View style={styles.buttonWrapper}>
                <NextButton
                  title="Cancel"
                  style={styles.buttonWidth}
                  onPress={() => setModalVisible(false)}
                />
                <GradientButton
                  title="Yes"
                  onPress={() => {
                    setIsLoading2(true);
                    setTimeout(() => {
                      setIsLoading2(false);
                      cancelSubscription();
                      setModalVisible(false);
                    }, 1000);
                  }}
                  style={styles.buttonWidth}
                  loading={isLoading2}
                  disabled={isLoading2}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {modalVisible3 && (
        <>
          <View style={styles.modalOverlay}>
            <SubscriptionModal
              text="Subscription cancelled successfully!"
              icon="checkcircle"
              onPress={() => {
                setIsLoading3(true);
                setTimeout(() => {
                  setIsLoading3(false);
                  setModalVisible3(false);
                  setModalVisible(false);
                  navigation.goBack();
                }, 1000);
              }}
              loading={isLoading3}
            />
          </View>
        </>
      )}

      {modalVisible2 && (
        <>
          <View style={styles.modalOverlay}>
            <SubscriptionModal
              text="Failed Try again."
              icon="exclamationcircle"
              onPress={() => setModalVisible2(false)}
            />
          </View>
        </>
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
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(11),
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ownerIcon: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
  },
  premiumText: {
    color: Colors.brown,
    fontSize: RFPercentage(2),
    fontFamily: Fonts.fontMedium,
    marginLeft: RFPercentage(0.6),
    top: RFPercentage(0.3),
  },
  subscriptionContainer: {
    marginTop: RFPercentage(4),
  },
  subscriptionBox: {
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 1)',
    borderRadius: RFPercentage(1.8),
    alignSelf: 'center',
    paddingVertical: RFPercentage(2),
  },
  starLeft: {
    position: 'absolute',
    left: 0,
  },
  starRight: {
    position: 'absolute',
    right: 0,
    bottom: RFPercentage(-1.5),
  },
  starIcon: {
    width: RFPercentage(5),
    height: RFPercentage(5),
  },
  priceText: {
    textAlign: 'center',
    color: Colors.brown,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(3.5),
  },
  priceSubText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.8)',
    marginTop: RFPercentage(1),
  },
  listContainer: {
    marginTop: RFPercentage(2),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1),
    margin: RFPercentage(0.8),
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 20,
    backgroundColor: Colors.placeholderColor,
  },
  listText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    marginLeft: 5,
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(5),
  },
  buttonText: {
    fontSize: RFPercentage(1.5),
  },
  starContainer: {
    position: 'absolute',
    right: RFPercentage(1.5),
    bottom: RFPercentage(10),
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
  buttonWidth: {
    width: RFPercentage(15),
  },
  modalCancel: {
    width: '90%',
    borderRadius: RFPercentage(2),
    backgroundColor: 'rgb(232, 243, 252)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    paddingHorizontal: RFPercentage(2.5),
    height: '50%',
    top: RFPercentage(20),
    paddingVertical: RFPercentage(3),
  },
  cancelHeading: {
    textAlign: 'center',
    fontSize: RFPercentage(2),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  cancelInfo: {
    textAlign: 'left',
    fontFamily: Fonts.fontMedium,
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: RFPercentage(32),
  },
  modalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(89, 92, 96, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
