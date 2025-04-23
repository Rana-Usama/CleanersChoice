import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
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
import CustomModal from '../../../components/CustomModal';
import SubscriptionModal from '../../../components/SubscriptionModal';
import Toast from 'react-native-toast-message';

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
      }
    };

    fetchSubscriptionId();
  }, [user?.uid]);

  const cancelSubscription = async () => {
    if (!subscriptionId) {
      Toast.show({
        text1: 'Error',
        text2: 'No active subscription found.',
        type: 'error',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });

      return;
    }

    const res = await fetch('http://192.168.100.30:3000/cancel-subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        subscriptionId: subscriptionId,
      }),
    });

    const result = await res.json();

    if (result.success) {
      if (user?.uid) {
        await firestore().collection('Users').doc(user.uid).update({
          subscription: false,
          subscriptionId: null,
        });
      }

      setModalVisible3(true);
    } else {
      setModalVisible2(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            title="Cancel"
            textStyle={styles.buttonText}
            onPress={() => setModalVisible(true)}
            style={{width: RFPercentage(18)}}
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
            <CustomModal
              title={'Are you sure you want to Cancel Subscription?'}
              onPress={() => setModalVisible(false)}
              onPress2={cancelSubscription}
              // loader={loading}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {modalVisible3 && (
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
              text="Subscription cancelled successfully!"
              icon="checkcircle"
              onPress={() => {
                setModalVisible3(false);
                setModalVisible(false);
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
});
