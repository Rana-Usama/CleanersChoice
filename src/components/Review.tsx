import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {IMAGES, Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const Review = props => {
  return (
    <View>
      <View style={styles.container}>
        <Image source={IMAGES.picture} resizeMode="contain" style={styles.image} />
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.name}>Demba</Text>
            <Text style={styles.time}>1 month ago</Text>
            <Text style={styles.reviewText}>
              The best cleaning service out there is alpha cleaners!
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Image source={IMAGES.star} resizeMode="contain" style={styles.starImage} />
            <Text style={styles.rating}>5.0</Text>
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
  image: {
    width: RFPercentage(5),
    height: RFPercentage(5),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  textContainer: {
    left: RFPercentage(1),
  },
  name: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  time: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    bottom: 2,
  },
  reviewText: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.2),
    marginTop: RFPercentage(0.2),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starImage: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    right: 3,
  },
  rating: {
    color: 'rgba(0, 0, 0, 1)',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.3),
    top: 1,
  },
});
