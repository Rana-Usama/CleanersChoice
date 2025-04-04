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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {useDispatch} from 'react-redux';
import CheckAvailable from '../../../components/CheckAvailable';

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

const CheckAvailability = ({route}) => {
  const {item} = route.params;
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'CheckAvailability'>
    >();

    const availableDays = item.availability.filter((day) => day.checked === true);
    console.log('check availablity............', availableDays);


  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title="Availability"
        textStyle={{fontSize: RFPercentage(1.8)}}
      />
      <View style={styles.container}>
        <View style={{marginTop: RFPercentage(3)}}>
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Image
              source={{uri: item.image}}
              style={{
                width: RFPercentage(12),
                height: RFPercentage(12),
                borderWidth: 3,
                borderColor: Colors.gradient1,
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
              {item.name}
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
              {item.name} are available during these times of every week
            </Text>
          </View>
        </View>
        <View style={{marginTop: RFPercentage(1.6)}}>
           <FlatList
            data={availableDays}
            keyExtractor={item => item.day}
            renderItem={({item}) => {
              return (
                <CheckAvailable
                  day={item.day}
                  fromTime={item.fromTime}
                  toTime={item.toTime}
                />
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CheckAvailability;

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
