import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import React, {useRef, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

const {width} = Dimensions.get('window');

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
  isFeatured?: boolean;
}

const ServicePackage = (props: props) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

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

    // Shine animation for featured packages
    if (props.isFeatured) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, []);

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{scale: scaleAnim}],
        },
        props.isSelected && styles.selectedContainer,
        props.isFeatured && styles.featuredContainer,
      ]}>
      {/* Shine Effect for Featured Packages */}
      {props.isFeatured && (
        <Animated.View
          style={[
            styles.shineEffect,
            {
              transform: [{translateX: shineTranslate}],
            },
          ]}
        />
      )}

      {/* Featured Ribbon */}
      {props.isFeatured && (
        <View style={styles.featuredRibbon}>
          <LinearGradient
            colors={[Colors.gold, Colors.orange500]}
            style={styles.ribbonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <MaterialCommunityIcons name="crown" size={12} color={Colors.white} />
            <Text style={styles.ribbonText}>BEST VALUE</Text>
          </LinearGradient>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={props.onPress}
        style={styles.touchableArea}>
        {/* Header with Elegant Gradient */}
        <LinearGradient
          colors={
            props.isFeatured
              ? [Colors.gradient1, Colors.gradient2]
              : ['rgba(78, 132, 255, 0.05)', 'rgba(78, 132, 255, 0.05)']
          }
          style={[styles.header, props.isFeatured && styles.featuredHeader]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          {props.isFeatured && (
            <MaterialCommunityIcons
              name="star"
              size={16}
              color={Colors.white}
              style={styles.headerIcon}
            />
          )}
          <Text
            style={[
              styles.packageName,
              props.isFeatured && styles.featuredPackageName,
            ]}>
            {props.name}
          </Text>
          {props.isFeatured && (
            <MaterialCommunityIcons
              name="star"
              size={16}
              color={Colors.white}
              style={styles.headerIcon}
            />
          )}
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.detailContainer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={props.isFeatured ? Colors.gradient1 : Colors.secondaryText}
              style={styles.detailIcon}
            />
            <Text
              style={[
                styles.detailText,
                props.isFeatured && styles.featuredDetailText,
              ]}
              numberOfLines={3}>
              {props.detail}
            </Text>
          </View>

          {/* Services/Features */}
          {props.services && props.services.length > 0 && (
            <View style={styles.featuresSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={14}
                  color={
                    props.isFeatured ? Colors.gradient1 : Colors.primaryText
                  }
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    props.isFeatured && styles.featuredSectionTitle,
                  ]}>
                  INCLUDED SERVICES
                </Text>
              </View>

              <View style={styles.featuresList}>
                {props.services.slice(0, 4).map((service, index) => (
                  <View key={service.id} style={styles.featureItem}>
                    <LinearGradient
                      colors={
                        props.isFeatured
                          ? [Colors.gradient1, Colors.gradient2]
                          : [Colors.inputBorder, Colors.slate300]
                      }
                      style={styles.featureIcon}>
                      <Feather
                        name="check"
                        size={10}
                        color={props.isFeatured ? Colors.white : Colors.slate500}
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.featureText,
                        props.isFeatured && styles.featuredFeatureText,
                      ]}
                      numberOfLines={1}>
                      {service.name}
                    </Text>
                  </View>
                ))}
              </View>

              {props.services.length > 4 && (
                <View style={styles.moreFeatures}>
                  <Text style={styles.moreFeaturesText}>
                    +{props?.services?.length - 4} more services included
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Price Section */}
          <LinearGradient
            colors={
              props.isFeatured
                ? [Colors.primaryBlueOverlay05, Colors.primaryBlueOverlay02]
                : ['rgba(69, 84, 103, 0.05)', 'rgba(69, 84, 103, 0.05)']
            }
            style={styles.priceSection}>
            <View style={styles.priceRow}>
              <View>
                <Text
                  style={[
                    styles.startsAtText,
                    props.isFeatured && styles.featuredStartsAtText,
                  ]}>
                  STARTING FROM
                </Text>
                <View style={styles.priceContainer}>
                  <Text
                    style={[
                      styles.currencySymbol,
                      props.isFeatured && styles.featuredCurrencySymbol,
                    ]}>
                    $
                  </Text>
                  <Text
                    style={[
                      styles.priceText,
                      props.isFeatured && styles.featuredPriceText,
                    ]}
                    numberOfLines={1}>
                    {props.price}
                  </Text>
                  <Text
                    style={[
                      styles.priceSuffix,
                      props.isFeatured && styles.featuredPriceSuffix,
                    ]}>
                    /service
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  props.isFeatured && styles.featuredSelectButton,
                ]}
                activeOpacity={0.8}
                onPress={props.onPress}>
                <LinearGradient
                  colors={
                    props.isFeatured
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['rgba(69, 84, 103, 0.1)', 'rgba(69, 84, 103, 0.1)']
                  }
                  style={styles.selectButtonGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  <Text
                    style={[
                      styles.selectButtonText,
                      props.isFeatured && styles.featuredSelectButtonText,
                    ]}>
                    {props.isFeatured ? 'SELECT' : 'VIEW'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {props.isFeatured && (
              <View style={styles.savingsBadge}>
                <Feather name="trending-up" size={10} color={Colors.white} />
                <Text style={styles.savingsText}>Save 15% vs basic</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Selection Indicator */}
        {(props.isSelected || props.isFeatured) && (
          <LinearGradient
            colors={[Colors.gradient1, Colors.gradient2]}
            style={styles.bottomIndicator}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ServicePackage;

const styles = StyleSheet.create({
  container: {
    width: width * 0.7,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: RFPercentage(1),
    marginVertical: RFPercentage(1),
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    // elevation: 8,
    borderWidth: 1.5,
    borderColor: Colors.slate100,
    overflow: 'hidden',

    borderBottomWidth: 2,
  },
  selectedContainer: {
    borderColor: Colors.gradient1,
    shadowColor: Colors.gradient1,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    // elevation: 12,
  },
  featuredContainer: {
    borderColor: Colors.gradient1,
    shadowColor: Colors.gradient1,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    // elevation: 16,
    transform: [{scale: 1.02}],
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.whiteOverlay40,
    zIndex: 1,
  },
  featuredRibbon: {
    position: 'absolute',
    top: RFPercentage(1),
    right: -RFPercentage(3),
    zIndex: 10,
    transform: [{rotate: '45deg'}],
  },
  ribbonGradient: {
    width: RFPercentage(18),
    paddingVertical: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.4),
  },
  ribbonText: {
    color: Colors.white,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.2),
    letterSpacing: 0.5,
  },
  touchableArea: {
    flex: 1,
  },
  header: {
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.slateBorderOverlay50,
    flexDirection: 'row',
    gap: RFPercentage(1),
  },
  featuredHeader: {
    borderBottomColor: Colors.whiteOverlay20,
  },
  headerIcon: {
    opacity: 0.8,
  },
  packageName: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    letterSpacing: 0.5,
  },
  featuredPackageName: {
    color: Colors.white,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.1),
  },
  content: {
    flex: 1,
    padding: RFPercentage(2),
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(2),
  },
  detailIcon: {
    marginTop: RFPercentage(0.2),
    marginRight: RFPercentage(0.8),
  },
  detailText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2),
    flex: 1,
  },
  featuredDetailText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
  },
  featuresSection: {
    marginBottom: RFPercentage(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.6),
  },
  sectionTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    letterSpacing: 0.5,
  },
  featuredSectionTitle: {
    color: Colors.gradient1,
  },
  featuresList: {
    gap: RFPercentage(0.8),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(1.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(0.8),
  },
  featureText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    flex: 1,
  },
  featuredFeatureText: {
    color: Colors.slate900,
    fontFamily: Fonts.fontSemiBold,
  },
  moreFeatures: {
    marginTop: RFPercentage(1),
    paddingTop: RFPercentage(1),
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
  },
  moreFeaturesText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  priceSection: {
    borderRadius: 12,
    padding: RFPercentage(1.5),
    marginTop: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startsAtText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    letterSpacing: 0.5,
    marginBottom: RFPercentage(0.3),
  },
  featuredStartsAtText: {
    color: Colors.gradient1,
    opacity: 0.8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    marginRight: RFPercentage(0.2),
  },
  featuredCurrencySymbol: {
    color: Colors.gradient1,
  },
  priceText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.7),
    marginRight: RFPercentage(0.3),
  },
  featuredPriceText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(2.9),
  },
  priceSuffix: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
  },
  featuredPriceSuffix: {
    color: Colors.slate500,
  },
  selectButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 8,
  },
  featuredSelectButton: {
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // elevation: 4,
  },
  selectButtonText: {
    color: '#000000',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    letterSpacing: 0.5,
  },
  featuredSelectButtonText: {
    color: Colors.white,
    fontFamily: Fonts.fontBold,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    alignSelf: 'flex-start',
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
    borderRadius: 12,
    gap: RFPercentage(0.4),
    marginTop: RFPercentage(1),
  },
  savingsText: {
    color: Colors.white,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.2),
  },
  bottomIndicator: {
    height: RFPercentage(0.3),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
