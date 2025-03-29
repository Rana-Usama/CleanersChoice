import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import SetAvailablity from '../../../components/SetAvailablity';
import {useSelector} from 'react-redux';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {useDispatch} from 'react-redux';
import {cleanerAvailability} from '../../../redux/Availability/Actions';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


const days = [
  {
    id: 1,
    name: 'Mon',
  },
  {
    id: 2,
    name: 'Tue',
  },
  {
    id: 3,
    name: 'Wed',
  },
  {
    id: 4,
    name: 'Thu',
  },
  {
    id: 5,
    name: 'Fri',
  },
  {
    id: 6,
    name: 'Sat',
  },
  {
    id: 7,
    name: 'Sun',
  },
];

const Availability = () => {
  const [userRole, setUserRole] = useState('')
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'Availability'>
    >();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth().currentUser;
      if (!user) return;
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserRole(userData?.role)
        } else {
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserData();
  }, []);





  const [availabilityData, setAvailabilityData] = useState(
    days.map(day => ({
      day: day.name,
      fromTime: new Date().setHours(9, 0, 0, 0),
      toTime: new Date().setHours(18, 0, 0, 0),
    })),
  );

  const updateAvailability = (day, fromTime, toTime) => {
    setAvailabilityData(prev =>
      prev.map(item => (item.day === day ? {...item, fromTime, toTime} : item)),
    );
  };

  const handleSetAvailability = () => {
    setLoading(true)
    dispatch(cleanerAvailability(availabilityData));
    setTimeout(() => {
      setLoading(false)
      navigation.navigate('ServiceOne');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title="Availability"
        textStyle={{fontSize: RFPercentage(1.8)}}
      />
      <View style={styles.container}>
        <View style={{marginTop: RFPercentage(3)}}>
          {userRole === 'Customer' ? (
            <>
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <Image
                  source={IMAGES.alpha}
                  style={{width: RFPercentage(10), height: RFPercentage(10)}}
                  resizeMode="contain"
                  borderRadius={RFPercentage(100)}
                />
                <Text
                  style={{
                    color: Colors.primaryText,
                    fontFamily: Fonts.fontMedium,
                    fontSize: RFPercentage(1.8),
                    lineHeight: RFPercentage(2.8),
                    marginTop: RFPercentage(1),
                  }}>
                  Alpha Cleaners
                </Text>
                <Text
                  style={{
                    color: Colors.secondaryText,
                    fontFamily: Fonts.fontMedium,
                    fontSize: RFPercentage(1.5),
                    lineHeight: RFPercentage(2.8),
                    marginTop: RFPercentage(2.2),
                    textAlign: 'center',
                  }}>
                  Alpha Cleaners are available during these time of the week
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: Colors.primaryText,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.6),
                  textAlign: 'center',
                  lineHeight: RFPercentage(2.8),
                }}>
                Set your weekly availability. Edit any day if needed
              </Text>
            </>
          )}
        </View>
        <View style={{marginTop: RFPercentage(1.6)}}>
          <FlatList
            data={days}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              return (
                <SetAvailablity
                  day={item.name}
                  fromTime={
                    availabilityData.find(d => d.day === item.name)?.fromTime
                  }
                  toTime={
                    availabilityData.find(d => d.day === item.name)?.toTime
                  }
                  onUpdateAvailability={updateAvailability}
                />
              );
            }}
          />
        </View>
        {userRole === 'Cleaner' && (
          <>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginTop: RFPercentage(4.8),
              }}>
              <GradientButton
                title="Set Availability"
                textStyle={{fontSize: RFPercentage(1.5)}}
                onPress={handleSetAvailability}
                loading={loading}
                />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Availability;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    backgroundColor: Colors.background,
    width: '90%',
    alignSelf: 'center',
  },
});
