import {Image, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

const ServicesCard = ({covers, icon, name, price, rating, star, location}) => {
  const [step, setStep] = useState(0);

  return (
    <TouchableOpacity>
      <View style={styles.container}>
        <View style={{width: '100%', height: RFPercentage(13)}}>
          <Image
            source={covers[step]}
            resizeMode="cover"
            style={styles.image}
          />
        </View>
        <View style={styles.dotsContainer}>
          {covers.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => setStep(index)}>
              {step === index ? (
                <LinearGradient
                  colors={[Colors.gradient1, Colors.gradient2]}
                  style={styles.activeDot}
                />
              ) : (
                <View style={styles.inactiveDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.rowContainer}>
            <Image source={icon} resizeMode="contain" style={styles.icon} />
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.3),
              }}>
              {name}
            </Text>
          </View>

          <View style={styles.starContainer}>
            {Array.from({length: rating}, (_, index) => (
              <Image
                key={index}
                source={star}
                resizeMode="contain"
                style={styles.star}
              />
            ))}
          </View>

          <View style={styles.priceContainer}>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.3),
              }}>
              Starts at {price}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{
                  color: Colors.secondaryText,
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.1),
                }}>
                From :
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <EvilIcons
                  name="location"
                  size={RFPercentage(1.3)}
                  style={{bottom: 1.5}}
                />
                <Text
                  style={{
                    color: Colors.secondaryText,
                    fontFamily: Fonts.fontRegular,
                    fontSize: RFPercentage(1.1),
                  }}>
                  {location}
                </Text>
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
    marginTop: RFPercentage(1),
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
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1),
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: RFPercentage(0.4),
    marginLeft: RFPercentage(3.6),
  },
  star: {
    width: RFPercentage(1.3),
    height: RFPercentage(1.3),
    marginRight: RFPercentage(0.2),
    bottom: RFPercentage(0.5),
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RFPercentage(1.6),
  },
});
