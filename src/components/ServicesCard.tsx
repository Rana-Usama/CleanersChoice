import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import React, { useState } from 'react';
import { Colors, Fonts, IMAGES, Icons } from '../constants/Themes';
import { RFPercentage } from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';

interface Location {
  name?: string;
  [key: string]: any;
}

interface ServicesCardProps {
  covers: string[]; // URLs of service images
  icon?: string | null; // service icon URL
  name: string;
  price: number;
  rating?: number;
  star?: ImageSourcePropType;
  location?: Location;
  onPress: () => void;
  createdAt: { _seconds: number; _nanoseconds?: number };
}

const ServicesCard: React.FC<ServicesCardProps> = ({
  covers,
  icon,
  name,
  price,
  rating,
  star,
  location,
  onPress,
  createdAt,
}) => {
  const [step, setStep] = useState<number>(0);

  const createdAtDate = new Date(createdAt._seconds * 1000);
  const formattedDate = moment(createdAtDate).format('DD MMMM, YYYY');

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={styles.container}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: covers[step] }}
            resizeMode="cover"
            style={styles.image}
          />
          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              style={styles.priceGradient}
            >
              <Text style={styles.priceBadgeText}>${price}</Text>
            </LinearGradient>
          </View>

          {/* Image Overlay Gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)']}
            style={styles.imageOverlay}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Image
              source={icon ? { uri: icon } : IMAGES.defaultPic}
              resizeMode="cover"
              style={styles.serviceIcon}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {name}
              </Text>
              {/* Rating row can be added here */}
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.locationContainer}>
            <Image
              source={Icons.location}
              resizeMode="contain"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {location?.name
                ? location.name.length > 25
                  ? `${location.name.substring(0, 25)}...`
                  : location.name
                : 'Location not specified'}
            </Text>

            <View style={{ position: 'absolute', right: 0 }}>
              <Text
                style={{
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.1),
                  color: Colors.secondaryText,
                }}
              >
                Posted on: {formattedDate}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.startingText}>
              Starting price{' '}
              <Text
                style={{ color: Colors.gradient1, fontFamily: Fonts.semiBold }}
              >
                {price}$
              </Text>
            </Text>
            <View style={styles.availabilityDot} />
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
    backgroundColor: '#fff',
    borderRadius: RFPercentage(2.5),
    shadowColor: 'rgba(208, 227, 254, 0.8)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 232, 0.8)',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: RFPercentage(20),
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  priceBadge: {
    position: 'absolute',
    top: RFPercentage(1.5),
    right: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  priceGradient: {
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
  },
  priceBadgeText: {
    color: Colors.background,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
    textAlign: 'center',
    lineHeight: RFPercentage(1.5),
  },
  contentContainer: {
    padding: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.2),
  },
  serviceIcon: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1.2),
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
    backgroundColor: '#fff',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    marginBottom: RFPercentage(0.4),
    lineHeight: RFPercentage(2.2),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.2),
  },
  locationIcon: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    marginRight: RFPercentage(0.6),
    tintColor: Colors.secondaryText,
  },
  locationText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: RFPercentage(1),
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
  },
  startingText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  availabilityDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
