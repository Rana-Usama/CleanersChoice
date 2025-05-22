import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import {useSelector} from 'react-redux';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {useDispatch} from 'react-redux';
import {cleanerAvailability} from '../../../redux/Availability/Actions';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SetAvailability from '../../../components/SetAvailablity';

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
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'Availability'>
    >();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const profileData = useSelector(state => state.profile.profileData.role);
  const [service, setService] = useState(null);
  const profileCompletion = useSelector(
    state => state.profile.profileCompletion,
  );
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    const serviceDetails = async () => {
      const user = auth().currentUser;
      if (!user) return;
      setLoading2(true);
      try {
        const userDoc = await firestore()
          .collection('CleanerServices')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setService(userData);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading2(false);
      }
    };
    serviceDetails();
  }, []);

  const [availabilityData, setAvailabilityData] = useState([]);

  useEffect(() => {
    const updatedAvailability = days.map(day => {
      const found = service?.availability?.length > 0  && service?.availability?.find(item => item.day === day.name);
      return { 
        day: day.name,
        fromTime: found
          ? new Date(
              found.fromTime?._seconds
                ? found.fromTime._seconds * 1000
                : found.fromTime,
            )
          : new Date(new Date().setHours(9, 0, 0, 0)), 
        toTime: found
          ? new Date(
              found.toTime?._seconds
                ? found.toTime._seconds * 1000
                : found.toTime,
            )
          : new Date(new Date().setHours(18, 0, 0, 0)), 
        checked: found ? found.checked : false, 
      };
    });
  
    setAvailabilityData(updatedAvailability);
    // dispatch(cleanerAvailability(updatedAvailability));
  
  }, [service?.availability, days]);
  

  const toggleCheckBox = day => {
    setAvailabilityData(prev => {
      const updated = prev.map(item =>
        item.day === day ? {...item, checked: !item.checked} : item,
      );
      // dispatch(cleanerAvailability(updated));
      return updated;
    });
  };

  const updateAvailability = (day, fromTime, toTime) => {
    setAvailabilityData(prev => {
      const updated = prev.map(item =>
        item.day === day ? {...item, fromTime, toTime} : item,
      );
      // dispatch(cleanerAvailability(updated));
      return updated;
    });
  };

  const handleSetAvailability = () => {
    setLoading(true);
    dispatch(cleanerAvailability(availabilityData));
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ServiceOne');
    }, 1500);
  };
  
  
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title="Availability"
        textStyle={{fontSize: RFPercentage(2)}}
        left={true}
      />
      <View style={styles.container}>
        {loading2 ? (
          <>
            <ActivityIndicator size={'large'}  color={'rgba(75, 85, 99, 0.5)'} style={{marginTop:RFPercentage(20)}} />
          </>
        ) : (
          <>
            <View style={{marginTop: RFPercentage(3)}}>
              {profileData === 'Customer' ? (
                <>
                  <View
                    style={{alignItems: 'center', justifyContent: 'center'}}>
                    <Image
                      source={IMAGES.alpha}
                      style={{
                        width: RFPercentage(10),
                        height: RFPercentage(10),
                      }}
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
                      fontSize: RFPercentage(1.8),
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
                data={availabilityData}
                keyExtractor={item => item.day}
                renderItem={({item}) => {
                  return (
                    <SetAvailability
                      day={item.day}
                      fromTime={item.fromTime}
                      toTime={item.toTime}
                      checked={item.checked}
                      onUpdateAvailability={updateAvailability}
                      onToggleCheckBox={toggleCheckBox}
                    />
                  );
                }}
              />
            </View>
          </>
        )}
      </View>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                position: 'absolute',
                bottom:RFPercentage(34)

              }}>
              <GradientButton
                title={
                  profileCompletion === '100'
                    ? 'Edit Availability'
                    : 'Set Availability'
                }
                textStyle={{fontSize: RFPercentage(1.7)}}
                onPress={handleSetAvailability}
                loading={loading}
              />
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
