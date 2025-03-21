import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import SetAvailablity from '../../../components/SetAvailablity';
import {useSelector} from 'react-redux';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';

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
  const userFlow = useSelector(state => state.userFlow.userFlow);
  console.log('userFlow.........', userFlow);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title="Availability"
        textStyle={{fontSize: RFPercentage(1.8)}}
      />
      <View style={styles.container}>
        <View style={{marginTop: RFPercentage(3)}}>
          {userFlow === 'Customer' ? (
            <>
              <View style={{ alignItems: 'center', justifyContent:'center'}}>
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
                    marginTop:RFPercentage(1)
                  }}>
                  Alpha Cleaners
                </Text>
                <Text
                  style={{
                    color: Colors.secondaryText,
                    fontFamily: Fonts.fontMedium,
                    fontSize: RFPercentage(1.5),
                    lineHeight: RFPercentage(2.8),
                    marginTop:RFPercentage(2.2),
                    textAlign:'center'
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
              return <SetAvailablity day={item.name} />;
            }}
          />
        </View>
        {userFlow === 'Cleaner' && (
          <>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginTop: RFPercentage(4.5),
              }}>
              <GradientButton
                title="Set Availability"
                textStyle={{fontSize: RFPercentage(1.5)}}
                onPress={() => navigation.navigate('ServiceOne')}
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
