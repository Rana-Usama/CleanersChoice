import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import HeaderComponent from '../../../components/HeaderComponent';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStripe, createPaymentMethod} from '@stripe/stripe-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SubscriptionModal from '../../../components/SubscriptionModal';
import {BlurView} from '@react-native-community/blur';

const services = [
  {id: 1, name: 'Connect with cleaning customers'},
  {id: 2, name: 'See unlimited Job Listings'},
  {id: 3, name: 'List your services'},
  {id: 4, name: 'Cancel any time'},
];

const Premium = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Premium'>>();
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);

  console.log('customerId..............', customerId);

  const user = auth().currentUser;

  const fetchSetupIntent = async () => {
    try {
      const response = await fetch(
        'http://192.168.100.30:3000/create-subscription',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: user?.email}),
        },
      );
      const {setupIntentClientSecret, customerId} = await response.json();

      if (customerId) {
        setCustomerId(customerId); // Set customer ID here
      } else {
        throw new Error('Failed to get customer ID');
      }

      return setupIntentClientSecret;
    } catch (error) {
      console.error('Error fetching SetupIntent:', error);
      Alert.alert('Error', 'Could not create customer. Please try again.');
      return null;
    }
  };

  // Open Payment Sheet if customerId is available
  const openPaymentSheet = async () => {
    if (!customerId) {
      Alert.alert('Error', 'Customer ID is missing. Please try again.');
      return;
    }

    const clientSecret = await fetchSetupIntent();

    if (!clientSecret) return; // If the SetupIntent failed, stop here

    const {error: initError} = await initPaymentSheet({
      setupIntentClientSecret: clientSecret,
      merchantDisplayName: 'Cleaner Choice',
    });

    if (initError) {
      Alert.alert('Error', initError.message);
      return;
    }

    const {error: paymentError} = await presentPaymentSheet();

    if (paymentError) {
      Alert.alert('Failed', paymentError.message);
      return;
    }

    const res = await fetch('http://192.168.100.30:3000/confirm-subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        customerId: customerId,
      }),
    });

    const result = await res.json();
    console.log(result?.subscriptionId);

    if (result.success) {
      if (user?.uid) {
        await firestore().collection('Users').doc(user.uid).update({
          subscription: true,
          subscriptionId: result.subscriptionId,
        });
      }
      setModalVisible(true);
    } else {
      setModalVisible2(true);
    }
  };

  // useEffect(() => {
  //   fetchSetupIntent();
  // }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderComponent />
      <View style={styles.container}>
        <View style={styles.premiumHeader}>
          <Image
            source={Icons.owner}
            resizeMode="contain"
            style={styles.ownerIcon}
          />
          <Text style={styles.premiumText}>Premium Business Account</Text>
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
            title="Proceed To Payment"
            textStyle={styles.buttonText}
            onPress={openPaymentSheet}
            style={{width: RFPercentage(19)}}
            loading={loading}
          />
        </View>
      </View>

      <View style={styles.starContainer}>
        <Image source={IMAGES.stars} resizeMode="contain" style={styles.star} />
      </View>

      {modalVisible && (
        <>
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(89, 92, 96, 0.8)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <SubscriptionModal
              text="Subscription Plan Purchased Successfully"
              icon="checkcircle"
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('CleanerNavigator');
              }}
            />
          </View>
        </>
      )}

      {modalVisible2 && (
        <>
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(89, 92, 96, 0.8)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <SubscriptionModal
              text="Subscription Failed Try again."
              icon="exclamationcircle"
              onPress={() => setModalVisible2(false)}
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
});
