import {Image, StyleSheet, Text, View, TouchableOpacity, Platform} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts, IMAGES, Icons} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';

const ServicesCard = ({
  covers,
  icon,
  name,
  price,
  rating,
  star,
  location,
  onPress,
}) => {
  const [step, setStep] = useState(0);

  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: covers[step]}}
            resizeMode="cover"
            style={styles.image}
          />
        </View>
        <View style={styles.dotsContainer}>
          {covers.length === 1 ? null : (
            <>
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
            </>
          )}
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.rowContainer}>
            <Image
              source={icon ? {uri: icon} : IMAGES.defaultPic}
              resizeMode="contain"
              style={styles.icon}
            />
            <View>
              <Text style={styles.nameText}>
                {name?.length > 15 ? `${name.slice(0, 15)}...` : name}
              </Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                  <Image
                    source={Icons.location}
                    resizeMode="contain"
                    style={styles.icons}
                  />
                  <Text style={styles.locationText}>
                    {location.length > 10
                      ? `${location?.slice(0, 10)}...`
                      : location}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>Starts at {price}$</Text>
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
    borderBottomWidth: RFPercentage(0.5),
    height: RFPercentage(28.5),
    backgroundColor: '#fff',
  },

  imageContainer: {
    width: '100%',
    height: RFPercentage(16),
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
    height: RFPercentage(1),
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
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1),
    borderWidth: 1.5,
    borderColor: Colors.gradient1,
  },
  nameText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: RFPercentage(0.4),
    marginLeft: RFPercentage(3.6),
    height: RFPercentage(1),
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
    marginTop: RFPercentage(0.8),
  },
  priceText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fromText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.1),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:Platform.OS === 'ios' ? RFPercentage(0.3) : 0
  },
  locationIcon: {bottom: 1, left: -1},
  locationText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    left: RFPercentage(0.5),
  },
  icons: {width: RFPercentage(1.5), height: RFPercentage(1.5)},
});
