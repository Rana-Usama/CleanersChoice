import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Fonts} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';

const JobPosted = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'JobPosted'>>();
  const [loading, setLoading] = useState(false);

  // Animation values
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  const buttonScaleAnim = new Animated.Value(1);

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      navigation.navigate('Home', {screen: 'Job Board'});
    }, 1000);
  };

  return (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      style={styles.safeArea}>
      {/* Background Decorative Elements */}
      <View style={styles.backgroundCircles}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.centeredView,
          {
            // opacity: fadeAnim,
            // transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* Success Icon with Ring */}
        <View style={styles.iconContainer}>
          <View style={styles.iconRing}>
            <AntDesign
              name="checkcircle"
              color={Colors.background}
              size={RFPercentage(12)}
            />
          </View>
          {/* Animated Checkmark */}
          <View style={styles.checkmarkOverlay}>
            <AntDesign
              name="check"
              color={Colors.gradient2}
              size={RFPercentage(6)}
            />
          </View>
        </View>

        {/* Success Text */}
        <Text style={styles.successText}>Job Posted Successfully!</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your job has been posted and is now visible to service providers
        </Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Providers</Text>
            <Text style={styles.statDescription}>Will see your job</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2-4</Text>
            <Text style={styles.statLabel}>Hours</Text>
            <Text style={styles.statDescription}>Avg. response time</Text>
          </View>
        </View>
      </Animated.View>

      {/* Action Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{scale: buttonScaleAnim}],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          disabled={loading}
          style={styles.homeButton}>
          {loading ? (
            <ActivityIndicator size={'small'} color={Colors.gradient1} />
          ) : (
            <>
              <Text style={styles.homeButtonText}>Back to Home</Text>
              <AntDesign
                name="arrowright"
                size={RFPercentage(2)}
                color={Colors.gradient1}
                style={styles.buttonIcon}
              />
            </>
          )}
        </TouchableOpacity>

        {/* Additional Option */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.8}
          onPress={() => {
            navigation.navigate('PostJob', {jobId: null});
          }}>
          <Text style={styles.secondaryButtonText}>Post Another Job</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

export default JobPosted;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  backgroundCircles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: RFPercentage(50),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: RFPercentage(40),
    height: RFPercentage(40),
    top: '-10%',
    right: '-10%',
  },
  circle2: {
    width: RFPercentage(60),
    height: RFPercentage(60),
    bottom: '-15%',
    left: '-15%',
  },
  circle3: {
    width: RFPercentage(25),
    height: RFPercentage(25),
    top: '20%',
    left: '10%',
  },
  centeredView: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: RFPercentage(4),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(4),
    position: 'relative',
  },
  iconRing: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkmarkOverlay: {
    position: 'absolute',
    backgroundColor: Colors.background,
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    bottom: RFPercentage(-1),
    right: RFPercentage(-1),
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successText: {
    color: Colors.background,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(3.2),
    marginBottom: RFPercentage(1.5),
    textAlign: 'center',
    lineHeight: RFPercentage(3.8),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    marginBottom: RFPercentage(6),
    maxWidth: '90%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: RFPercentage(40),
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    flex: 0.48,
  },
  statNumber: {
    color: Colors.background,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.4),
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    color: Colors.background,
    fontFamily: Fonts.fontSemiBold,
    fontSize: RFPercentage(1.6),
    marginBottom: RFPercentage(0.3),
  },
  statDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: RFPercentage(8),
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(4),
  },
  homeButton: {
    width: '100%',
    height: RFPercentage(6.5),
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(3.25),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: RFPercentage(2),
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  homeButtonText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.9),
    marginRight: RFPercentage(1),
  },
  buttonIcon: {
    marginLeft: RFPercentage(0.5),
  },
  secondaryButton: {
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(3),
  },
  secondaryButtonText: {
    color: Colors.background,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
});
