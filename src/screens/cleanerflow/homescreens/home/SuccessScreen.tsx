import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts, Icons} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

const {width, height} = Dimensions.get('window');

const ProfileCompletionCongratulations = ({
  navigation,
  completionPercentage = 100,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef(
    Array.from({length: 6}, () => new Animated.Value(0)),
  ).current;

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
        useNativeDriver: false, // Changed to false for width interpolation
      }),
    ]).start();

    // Start celebration animations if 100%
    if (completionPercentage === 100) {
      // Confetti animation
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

      // Star floating animations
      starAnimations.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim, {
                  toValue: 1.2,
                  duration: 500,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 500,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ]),
              {iterations: 3},
            ),
          ]),
        ]).start();
      });
    }
  }, []);

  const animatedWidth = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Based on your service setup steps
  const completedSteps = [
    {
      step: 1,
      title: 'Service Details',
      description: 'Location, description & services',
      icon: 'map-marker-check',
      color: '#4CAF50',
    },
    {
      step: 2,
      title: 'Service Gallery',
      description: 'Uploaded showcase photos',
      icon: 'image-multiple',
      color: '#2196F3',
    },
    {
      step: 3,
      title: 'Service Packages',
      description: 'Pricing & package setup',
      icon: 'package-variant',
      color: '#9C27B0',
    },
    {
      step: 4,
      title: 'Availability',
      description: 'Working hours & schedule',
      icon: 'calendar-check',
      color: '#FF9800',
    },
  ];

  // Benefits specific to your cleaning service
  const benefits = [
    {
      icon: 'star-circle',
      title: 'Featured Listings',
      description: 'Priority in search results',
      color: '#FFD700',
    },
    {
      icon: 'trending-up',
      title: 'Higher Bookings',
      description: 'More cleaning jobs daily',
      color: '#4CAF50',
    },
    {
      icon: 'badge-account',
      title: 'Trusted Cleaner',
      description: 'Verified service provider',
      color: '#2196F3',
    },
    {
      icon: 'cash-multiple',
      title: 'Steady Income',
      description: 'Regular cleaning contracts',
      color: '#9C27B0',
    },
  ];

  // Stats based on typical cleaner profile
  const profileStats = [
    {label: 'Response Rate', value: '95%', change: 'excellent'},
    {label: 'Avg. Rating', value: '4.9★', change: 'rating'},
    {label: 'Jobs Completed', value: '25+', change: 'reliable'},
    {label: 'Repeat Clients', value: '70%', change: 'trusted'},
  ];

  const handleGoToDashboard = () => {
    navigation.navigate('CleanerNavigator', {screen: 'Job List'});
  };

  const handleViewProfile = () => {
    navigation.navigate('CleanerNavigator', {screen: 'Home'});
  };

  // Floating star positions
  const starPositions = [
    {top: RFPercentage(34), left: RFPercentage(4)},
    {top: RFPercentage(6), left: RFPercentage(37)},
    {top: RFPercentage(7), left: RFPercentage(14)},
    {top: RFPercentage(17), left: RFPercentage(34)},
    {top: RFPercentage(14), left: RFPercentage(40)},
    {top: RFPercentage(14), left: RFPercentage(4)},
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.gradient1} barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[Colors.gradient1, Colors.gradient2]}
          style={styles.backgroundGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />

        {/* Celebration Elements */}
        {completionPercentage === 100 && (
          <View style={styles.starsContainer}>
            {starPositions.map((pos, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.floatingStar,
                  {
                    top: pos.top,
                    left: pos.left,
                    right: pos.right,
                    transform: [
                      {scale: starAnimations[index]},
                      {
                        rotate: starAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}>
                <Icon name="star" size={20} color="#FFD700" />
              </Animated.View>
            ))}
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Animated.View
            style={[styles.logoContainer, {transform: [{scale: scaleValue}]}]}>
            <AntDesign
              name="checkcircle"
              color={Colors.background}
              size={RFPercentage(10)}
            />
          </Animated.View>

          <Animated.Text style={[styles.title, {opacity: fadeValue}]}>
            Profile Complete! 🎉
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, {opacity: fadeValue}]}>
            {`Your cleaning service is now\nready for bookings`}
          </Animated.Text>

          {completionPercentage === 100 && (
            <Animated.View
              style={[styles.sparkleContainer, {opacity: fadeValue}]}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
              <Text style={styles.perfectText}>Ready to Start Cleaning!</Text>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
            </Animated.View>
          )}
        </View>

        {/* Steps Completion Section */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Setup Completed</Text>
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>{completionPercentage}%</Text>
              {completionPercentage === 100 && (
                <Animated.View style={styles.crownIcon}>
                  <Icon name="crown" size={18} color="#FFD700" />
                </Animated.View>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, {width: animatedWidth}]}>
              {completionPercentage === 100 && (
                <Animated.View
                  style={[
                    styles.progressShine,
                    {
                      transform: [
                        {
                          translateX: confettiAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, width],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Completed Steps */}
          <View style={styles.stepsContainer}>
            {completedSteps.map((step, index) => (
              <Animated.View
                key={step.step}
                style={[
                  styles.stepCard,
                  {
                    opacity: fadeValue,
                    transform: [
                      {
                        translateY: fadeValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      {backgroundColor: `${step.color}20`},
                    ]}>
                    <Icon name={step.icon} size={24} color={step.color} />
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
                <View style={styles.stepStatus}>
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.stepStatusText}>Completed</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Benefits for Cleaners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Benefits as a Cleaner</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.benefitCard,
                  {
                    opacity: fadeValue,
                    transform: [
                      {
                        translateY: fadeValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <View
                  style={[
                    styles.benefitIconContainer,
                    {backgroundColor: `${benefit.color}20`},
                  ]}>
                  <Icon name={benefit.icon} size={24} color={benefit.color} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Expected Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Performance</Text>
          <View style={styles.statsContainer}>
            {profileStats.map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCard,
                  {
                    opacity: fadeValue,
                    transform: [
                      {
                        scale: fadeValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View
                  style={[
                    styles.statBadge,
                    stat.change === 'excellent' && styles.excellentBadge,
                    stat.change === 'rating' && styles.ratingBadge,
                    stat.change === 'reliable' && styles.reliableBadge,
                    stat.change === 'trusted' && styles.trustedBadge,
                  ]}>
                  <Text style={styles.statBadgeText}>
                    {stat.change === 'excellent' && 'Excellent'}
                    {stat.change === 'rating' && 'Top Rated'}
                    {stat.change === 'reliable' && 'Reliable'}
                    {stat.change === 'trusted' && 'Trusted'}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Next Steps for Cleaners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Getting Cleaning Jobs</Text>
          <View style={styles.nextStepsContainer}>
            <View style={styles.nextStepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Browse Cleaning Jobs</Text>
                <Text style={styles.stepDescription}>
                  Check available cleaning requests in your area
                </Text>
              </View>
            </View>

            <View style={styles.nextStepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Accept Bookings</Text>
                <Text style={styles.stepDescription}>
                  Review and accept cleaning appointments
                </Text>
              </View>
            </View>

            <View style={styles.nextStepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Earn Reviews</Text>
                <Text style={styles.stepDescription}>
                  Complete jobs and get 5-star reviews
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToDashboard}
            activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              style={styles.buttonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Icon name="broom" size={24} color="white" />
              <Text style={styles.primaryButtonText}>Start Cleaning Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewProfile}
            activeOpacity={0.8}>
            <Icon name="eye" size={20} color={Colors.gradient1} />
            <Text style={styles.secondaryButtonText}>View My Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Celebration Message */}
        {completionPercentage === 100 && (
          <Animated.View
            style={[styles.celebrationMessage, {opacity: fadeValue}]}>
            <Icon name="party-popper" size={20} color="#FFD700" />
            <Text style={styles.celebrationText}>
              You're now a verified cleaning service provider!
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.4,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  starsContainer: {
    // position: 'absolute',
  },
  floatingStar: {
    position: 'absolute',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    marginBottom: 20,
    marginTop:20
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  checkIcon: {
    width: 40,
    height: 40,
    tintColor: '#4CAF50',
  },
  title: {
    fontSize: RFPercentage(3),
    fontFamily: Fonts.semiBold,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 10,
  },
  sparkleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  perfectText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.semiBold,
    color: '#FFD700',
    marginHorizontal: 8,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    // elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginRight: 8,
  },
  crownIcon: {
    marginLeft: 5,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.gradient1,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepsContainer: {
    marginTop: 10,
  },
  stepCard: {
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    flex: 1,
  },
  stepDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    marginBottom: 8,
  },
  stepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepStatusText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
    color: '#4CAF50',
    marginLeft: 6,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  statBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  excellentBadge: {
    backgroundColor: '#E8F5E9',
  },
  ratingBadge: {
    backgroundColor: '#FFF3E0',
  },
  reliableBadge: {
    backgroundColor: '#E3F2FD',
  },
  trustedBadge: {
    backgroundColor: '#F3E5F5',
  },
  statBadgeText: {
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
  },
  nextStepsContainer: {
    marginTop: 10,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gradient1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  ctaContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 100,
    overflow: 'hidden',
    // elevation: 5,
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: 'white',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginLeft: 10,
  },
  celebrationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  celebrationText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.semiBold,
    color: '#FFA000',
    marginLeft: 10,
  },
});

export default ProfileCompletionCongratulations;
