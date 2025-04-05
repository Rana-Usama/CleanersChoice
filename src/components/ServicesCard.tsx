import {Image, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts, IMAGES} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

const ServicesCard = ({covers, icon, name, price, rating, star, location, onPress}) => {
  const [step, setStep] = useState(0);

  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{uri : covers[step]}} resizeMode="cover" style={styles.image} />
        </View>
        <View style={styles.dotsContainer}>
          {covers.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => setStep(index)}>
              {step === index ? (
                <LinearGradient colors={[Colors.gradient1, Colors.gradient2]} style={styles.activeDot} />
              ) : (
                <View style={styles.inactiveDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.rowContainer}>
            <Image source={icon ? {uri : icon} : IMAGES.defaultPic} resizeMode="contain" style={styles.icon} />
            <Text style={styles.nameText}>{name}</Text>
          </View>
          <View style={styles.starContainer}>
            {Array.from({length: rating}, (_, index) => (
              <Image key={index} source={star} resizeMode="contain" style={styles.star} />
            ))}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>Starts at {price}$</Text>
            <View style={styles.locationContainer}>
              <Text style={styles.fromText}>From :</Text>
              <View style={styles.locationRow}>
                <EvilIcons name="location" size={RFPercentage(1.3)} style={styles.locationIcon} />
                <Text style={styles.locationText}>{location?.slice(0, 5)}..</Text>
                </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ServicesCard;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderColor: Colors.inputFieldColor,
    borderWidth: 1,
    borderRadius: RFPercentage(1),
    // backgroundColor:'red', 
    height:RFPercentage(25)
  },
  imageContainer: {
    width: '100%',
    height: RFPercentage(13),
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopRightRadius: RFPercentage(1),
    borderTopLeftRadius: RFPercentage(1),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1.1),
  },
  activeDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
  },
  inactiveDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
  detailsContainer: {
    padding: RFPercentage(1),
    // backgroundColor:'red'
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2.9),
    height: RFPercentage(2.9),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1),
    borderWidth:1.5,
    borderColor:Colors.gradient1
  },
  nameText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: RFPercentage(0.4),
    marginLeft: RFPercentage(3.6),
  },
  star: {
    width: RFPercentage(1.2),
    height: RFPercentage(1.2),
    marginRight: RFPercentage(0.2),
    bottom: RFPercentage(0.6),
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  priceText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop:RFPercentage(0.2)
  },
  fromText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.1),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  locationIcon: {
    bottom: 1.5,
  },
  locationText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.1),
    left: 2,
  },
});
