import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import CheckAvailable from '../../../components/CheckAvailable';

const CheckAvailability = ({route}: any) => {
  const {item} = route.params;
  const availableDays = item.availability.filter(
    (day: any) => day.checked === true,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      <HeaderBack
        title="Availability"
        textStyle={styles.headerText}
        left={true}
      />
      <View style={styles.container}>
        <View style={styles.topMargin}>
          <View style={styles.imageWrapper}>
            <Image
              source={item.image ? {uri: item.image} : IMAGES.defaultPic}
              style={styles.image}
              resizeMode="contain"
              borderRadius={RFPercentage(100)}
            />
            <Text style={styles.nameText}>{item.name}</Text>
            <Text style={styles.descriptionText}>
              {item.name} are available during these times of every week
            </Text>
          </View>
        </View>
        <View style={styles.listWrapper}>
          <FlatList
            data={availableDays}
            keyExtractor={item => item.day}
            renderItem={({item}) => (
              <CheckAvailable
                day={item.day}
                fromTime={item.fromTime}
                toTime={item.toTime}
              />
            )}
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
  container: {
    backgroundColor: Colors.background,
    width: '90%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  topMargin: {
    marginTop: RFPercentage(3),
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderWidth: 3,
    borderColor: Colors.gradient1,
  },
  nameText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
    lineHeight: RFPercentage(2.8),
    marginTop: RFPercentage(1.5),
    textAlign: 'center',
  },
  descriptionText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2.8),
    marginTop: RFPercentage(2.2),
    textAlign: 'center',
  },
  listWrapper: {
    marginTop: RFPercentage(1.6),
  },
});
