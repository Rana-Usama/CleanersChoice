import {StyleSheet, Text, TouchableOpacity, View, Animated} from 'react-native';
import React, {useRef, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';

interface Service {
  id: number;
  name: string;
}

interface props {
  name: string;
  services?: Service[];
  price: string;
  detail: string;
  onPress: () => void;
  isSelected?: boolean;
}

const Package = (props: props) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{scale: scaleAnim}],
        },
        props.isSelected && styles.selectedContainer,
      ]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={props.onPress}
        style={styles.touchableArea}>
        
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={props.isSelected ? [Colors.gradient1, Colors.gradient2] : ['#fcfcfcff', '#fafafaff']}
          style={styles.header}
        >
          <Text style={[
            styles.packageName,
            props.isSelected && styles.selectedPackageName
          ]}>
            {props.name}
          </Text>
          {props.isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>Popular</Text>
            </View>
          )}
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailText} numberOfLines={5}>
              {props.detail}
            </Text>
          </View>

          {/* Features List (if services are provided) */}
          {props.services && props.services.length > 0 && (
            <View style={styles.featuresContainer}>
              {props.services.slice(0, 3).map((service, index) => (
                <View key={service.id} style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText} numberOfLines={1}>
                    {service.name}
                  </Text>
                </View>
              ))}
              {props.services.length > 3 && (
                <Text style={styles.moreFeaturesText}>
                  +{props.services.length - 3} more services
                </Text>
              )}
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceDivider} />
            <View style={styles.priceContainer}>
              <Text style={styles.startsAtText}>Starts at</Text>
              <Text style={styles.priceText} numberOfLines={1}>${props.price}</Text>
              <Text style={styles.priceSuffix}>/service</Text>
            </View>
          </View>
        </View>

        {/* Hover/Selection Indicator */}
        {props.isSelected && (
          <View style={styles.selectionIndicator}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              style={styles.indicatorGradient}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Package;

const styles = StyleSheet.create({
  container: {
    width: RFPercentage(22),
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(2),
    marginHorizontal: RFPercentage(0.8),
    marginVertical: RFPercentage(1),
    // Shadow
    shadowColor: 'rgba(140, 161, 189, 0.8)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  selectedContainer: {
    borderColor: Colors.gradient1,
    shadowColor: Colors.gradient1,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    transform: [{scale: 1.02}],
  },
  touchableArea: {
    flex: 1,
  },
  header: {
    paddingVertical: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(1.5),
    borderTopLeftRadius: RFPercentage(1.8),
    borderTopRightRadius: RFPercentage(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth:1,
    borderBottomColor:"rgba(197, 215, 232, 1)"
  },
  packageName: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    textAlign: 'center',
  },
  selectedPackageName: {
    color: Colors.background,
    fontFamily: Fonts.fontBold,
  },
  selectedBadge: {
    position: 'absolute',
    top: -RFPercentage(1),
    right: RFPercentage(1),
    backgroundColor: Colors.background,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(1),
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedBadgeText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.1),
  },
  content: {
    flex: 1,
    padding: RFPercentage(1.5),
    paddingTop: RFPercentage(1.8),
  },
  detailContainer: {
    marginBottom: RFPercentage(1.2),
    
  },
  detailText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    lineHeight: RFPercentage(1.8),
    textAlign: 'left',
  },
  featuresContainer: {
    marginBottom: RFPercentage(1.5),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(0.5),
  },
  featureDot: {
    width: RFPercentage(0.6),
    height: RFPercentage(0.6),
    borderRadius: RFPercentage(0.3),
    backgroundColor: Colors.gradient1,
    marginRight: RFPercentage(0.8),
  },
  featureText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    flex: 1,
  },
  moreFeaturesText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    textAlign: 'center',
    marginTop: RFPercentage(0.5),
    fontStyle: 'italic',
  },
  priceSection: {
    marginTop: 'auto',
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: RFPercentage(1.2),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  startsAtText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginRight: RFPercentage(0.4),
  },
  priceText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2),
    marginRight: RFPercentage(0.3),
  },
  priceSuffix: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.2),
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{translateX: -RFPercentage(1.5)}],
  },
  indicatorGradient: {
    width: RFPercentage(3),
    height: RFPercentage(0.4),
    borderTopLeftRadius: RFPercentage(0.2),
    borderTopRightRadius: RFPercentage(0.2),
  },
});