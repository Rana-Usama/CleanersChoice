import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import HeaderComponent from '../../../components/HeaderComponent';
import GradientButton from '../../../components/GradientButton';
import {useStripe} from '@stripe/stripe-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SubscriptionModal from '../../../components/SubscriptionModal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {showToast} from '../../../utils/ToastMessage';

const services = [
  {id: 1, name: 'Connect with cleaning customers'},
  {id: 2, name: 'See unlimited Job Listings'},
  {id: 3, name: 'List your services'},
  {id: 4, name: 'Cancel any time'},
];

const Premium = ({navigation} : any) => {
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [loading, setLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
        } catch (error) {
        }
      }
    };

    fetchUserData();
  }, [user?.email]);

  // Fetching payment intent
  const fetchSetupIntent = async () => {
    try {
      const response = await fetch(
        'https://cleaners-choice-server.vercel.app/api/create-subscription',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: user?.email}),
        },
      );
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
      showToast({
        type: 'info',
        title: 'Subscription',
        message: 'Subscription has not been fullfiled!',
      });
      setLoading(false);
      return;
    }

    // Payment
    const setupIntentId = setupIntentClientSecret.split('_secret')[0];
    const res = await fetch(
      'https://cleaners-choice-server.vercel.app/api/confirm-subscription',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({customerId, setupIntentId}),
      },
    );
    const result = await res.json();
    if (result.success) {
      const {periodEndTimestamp} = result;
      if (user?.uid) {
        await firestore().collection('Users').doc(user.uid).update({
          subscription: true,
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
      setModalVisible2(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        style={styles.arrow}>
        <AntDesign
          name="arrowleft"
          color={Colors.secondaryText}
          size={RFPercentage(3)}
        />
      </TouchableOpacity>
      <HeaderComponent />
      <View style={styles.container}>
        <View style={styles.premiumHeader}>
          {currentUser?.cancelSubscription === true &&
          currentUser?.subscriptionEndDate < Date.now() ? (
            <>
              <Image
                source={Icons.owner}
                resizeMode="contain"
                style={styles.ownerIcon}
              />
              <Text style={styles.premiumText}>Renew Your Premium Account</Text>
            </>
          ) : (
            <>
              <Image
                source={Icons.owner}
                resizeMode="contain"
                style={styles.ownerIcon}
              />
              <Text style={styles.premiumText}>Premium Business Account</Text>
            </>
          )}
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
            title={
              currentUser?.cancelSubscription === true &&
              currentUser?.subscriptionEndDate < Date.now()
                ? 'Renew Subscription'
                : 'Proceed To Payment'
            }
            textStyle={styles.buttonText}
            onPress={openPaymentSheet}
            style={{width: RFPercentage(19)}}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.starContainer}>
        <Image source={IMAGES.stars} resizeMode="contain" style={styles.star} />
      </View>

      {/* Modals */}
        {modalVisible2 && (
        <>
          <View style={styles.modalOverlay}>
            <SubscriptionModal
              text="Subscription Failed Try again."
              icon="exclamationcircle"
              onPress={() => {
                setModalVisible2(false), setLoading(false);
              }}
            />
          </View>
        </>
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
    fontSize: RFPercentage(1.4),
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
  modalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(89, 92, 96, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: RFPercentage(7),
    left: RFPercentage(3),
  },
});
