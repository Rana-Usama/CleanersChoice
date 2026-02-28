import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts, Icons} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const ProfileCompletionCongratulations = ({completionPercentage = 100}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const [expandedSection, setExpandedSection] = useState('benefits'); // 'benefits', 'stats', or 'steps'
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Start main animations
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 10,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressValue, {
        toValue: completionPercentage,
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();

    if (completionPercentage === 100) {
      Animated.sequence([
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnimation, {
          toValue: 0,
          duration: 1000,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const toggleSection = (section: any) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const completedSteps = [
    {
      step: 1,
      title: 'Service Details',
      description: 'Location, description & services',
      icon: 'map-marker-check',
      color: Colors.materialGreen,
    },
    {
      step: 2,
      title: 'Service Gallery',
      description: 'Uploaded showcase photos',
      icon: 'image-multiple',
      color: Colors.materialBlue,
    },
    {
      step: 3,
      title: 'Service Packages',
      description: 'Pricing & package setup',
      icon: 'package-variant',
      color: Colors.materialPurple,
    },
    {
      step: 4,
      title: 'Availability',
      description: 'Working hours & schedule',
      icon: 'calendar-check',
      color: Colors.materialOrange,
    },
  ];

  const benefits = [
    {
      icon: 'star-circle',
      title: 'Featured',
      description: 'Priority in search results',
      color: Colors.gold,
    },
    {
      icon: 'trending-up',
      title: 'Higher Bookings',
      description: 'More jobs daily',
      color: Colors.materialGreen,
    },
    {
      icon: 'badge-account',
      title: 'Trusted',
      description: 'Verified provider',
      color: Colors.materialBlue,
    },
    {
      icon: 'cash-multiple',
      title: 'Steady Income',
      description: 'Regular contracts',
      color: Colors.materialPurple,
    },
  ];

  const profileStats = [
    {label: 'Response', value: '95%'},
    {label: 'Rating', value: '4.9★'},
    {label: 'Jobs', value: '25+'},
    {label: 'Repeat', value: '70%'},
  ];

  const handleGoToDashboard = () => {
    navigation.navigate('CleanerNavigator', {screen: 'Job List'});
  };

  const handleViewProfile = () => {
    navigation.navigate('CleanerNavigator', {screen: 'Home'});
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      <ScrollView>
        {/* Background Gradient */}
        <LinearGradient
          colors={[Colors.gradient1, Colors.gradient2]}
          style={styles.backgroundGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />

        {/* Main Content - No ScrollView */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoContainer,
                {transform: [{scale: scaleValue}]},
              ]}>
              <AntDesign
                name="checkcircle"
                color={Colors.background}
                size={RFPercentage(8)}
              />
            </Animated.View>

            <Animated.Text style={[styles.title, {opacity: fadeValue}]}>
              Profile Complete! 🎉
            </Animated.Text>

            <Animated.Text style={[styles.subtitle, {opacity: fadeValue}]}>
              Your cleaning service is now ready
            </Animated.Text>

            {completionPercentage === 100 && (
              <Animated.View
                style={[styles.sparkleContainer, {opacity: fadeValue}]}>
                <Ionicons name="sparkles" size={16} color={Colors.gold} />
                <Text style={styles.perfectText}>Ready to Start Cleaning!</Text>
                <Ionicons name="sparkles" size={16} color={Colors.gold} />
              </Animated.View>
            )}
          </View>

          {/* Collapsible Content Areas */}
          <View style={styles.collapsibleContainer}>
            {/* Steps Toggle */}
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('steps')}
              activeOpacity={0.7}>
              <Text style={styles.collapsibleTitle}>Completed Steps</Text>
              <Icon
                name={
                  expandedSection === 'steps' ? 'chevron-up' : 'chevron-down'
                }
                size={20}
                color={Colors.gradient1}
              />
            </TouchableOpacity>

            {expandedSection === 'steps' && (
              <Animated.View style={styles.stepsGrid}>
                {completedSteps.map(step => (
                  <View key={step.step} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepIcon,
                        {backgroundColor: `${step.color}20`},
                      ]}>
                      <Icon name={step.icon} size={20} color={step.color} />
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                    <Icon name="check-circle" size={16} color={Colors.materialGreen} />
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Benefits Toggle */}
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('benefits')}
              activeOpacity={0.7}>
              <Text style={styles.collapsibleTitle}>Your Benefits</Text>
              <Icon
                name={
                  expandedSection === 'benefits' ? 'chevron-up' : 'chevron-down'
                }
                size={20}
                color={Colors.gradient1}
              />
            </TouchableOpacity>

            {expandedSection === 'benefits' && (
              <View style={styles.benefitsGrid}>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View
                      style={[
                        styles.benefitIcon,
                        {backgroundColor: `${benefit.color}20`},
                      ]}>
                      <Icon
                        name={benefit.icon}
                        size={20}
                        color={benefit.color}
                      />
                    </View>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDesc}>
                      {benefit.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {expandedSection === 'stats' && (
              <View style={styles.statsGrid}>
                {profileStats.map((stat, index) => (
                  <View key={index} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Next Steps Summary */}
          <View style={styles.nextStepsSummary}>
            <Text style={styles.summaryTitle}>Start Getting Cleaning Jobs</Text>
            <View style={styles.summaryPoints}>
              <View style={styles.summaryPoint}>
                <View style={styles.pointBullet} />
                <Text style={styles.pointText}>
                  Browse available cleaning requests
                </Text>
              </View>
              <View style={styles.summaryPoint}>
                <View style={styles.pointBullet} />
                <Text style={styles.pointText}>
                  Accept and confirm bookings
                </Text>
              </View>
              <View style={styles.summaryPoint}>
                <View style={styles.pointBullet} />
                <Text style={styles.pointText}>Earn 5-star reviews</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToDashboard}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                style={styles.buttonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Icon name="broom" size={22} color="white" />
                <Text style={styles.primaryButtonText}>
                  Start Cleaning Jobs
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewProfile}
              activeOpacity={0.8}>
              <Icon name="eye" size={18} color={Colors.gradient1} />
              <Text style={styles.secondaryButtonText}>View My Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Celebration Footer */}
          {completionPercentage === 100 && (
            <View style={styles.celebrationFooter}>
              <Icon name="party-popper" size={16} color={Colors.gold} />
              <Text style={styles.celebrationText}>
                You're now a verified cleaning service provider!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: RFPercentage(2.5),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.whiteOverlay90,
    textAlign: 'center',
    marginBottom: 10,
  },
  sparkleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldOverlay20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 8,
  },
  perfectText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
    marginHorizontal: 6,
  },
  progressSection: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: Colors.gray800,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginRight: 6,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.gradient1,
    borderRadius: 3,
  },
  collapsibleContainer: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  collapsibleTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: Colors.navyText,
  },
  stepsGrid: {
    marginTop: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ghostWhite,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
  },
  stepDesc: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    marginTop: 2,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  benefitItem: {
    width: '48%',
    backgroundColor: Colors.ghostWhite,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.gray700,
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.ghostWhite,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontRegular,
    color: Colors.placeholderColor,
  },
  nextStepsSummary: {
    backgroundColor: Colors.skyBlueBg,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 10,
  },
  summaryPoints: {
    paddingLeft: 5,
  },
  summaryPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gradient1,
    marginRight: 10,
  },
  pointText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.gray700,
    flex: 1,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginLeft: 8,
  },
  celebrationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldOverlay10,
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  celebrationText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.semiBold,
    color: Colors.amberDark,
    marginLeft: 8,
  },
});

export default ProfileCompletionCongratulations;
