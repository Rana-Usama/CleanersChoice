import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {IMAGES, Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const Review = props => {
  return (
    <View>
      <View style={styles.container}>
        <Image
          source={IMAGES.picture}
          resizeMode="contain"
          style={{width: RFPercentage(5), height: RFPercentage(5)}}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
          }}>
          <View style={{left: RFPercentage(1)}}>
            <Text
              style={{
                color: Colors.placeholderColor,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              Demba
            </Text>
            <Text
              style={{
                color: Colors.placeholderColor,
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.3),
                bottom: 2,
              }}>
              1 month ago
            </Text>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.2),
                marginTop: RFPercentage(0.2),
              }}>
              The best cleaning service out there is alpha cleaners!
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Image
              source={IMAGES.star}
              resizeMode="contain"
              style={{
                width: RFPercentage(1.6),
                height: RFPercentage(1.6),
                right: 3,
              }}
            />
            <Text
              style={{
                color: 'rgba(0, 0, 0, 1)',
                fontFamily: Fonts.semiBold,
                fontSize: RFPercentage(1.3),
                top: 1,
              }}>
              5.0
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Review;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
  },
});
