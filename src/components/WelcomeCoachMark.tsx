import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import LogoIcon from '../assets/svg/LogoIcon';
import Stars from '../assets/svg/Stars';

interface WelcomeCoachMarkProps {
  visible: boolean;
  onSkip: () => void;
  onNext: () => void;
  title?: string;
  subtitle?: string;
}

const WelcomeCoachMark: React.FC<WelcomeCoachMarkProps> = ({
  visible,
  onSkip,
  onNext,
  title = 'Welcome to Cleaners Choice',
  subtitle = 'Set up your profile and showcase services to get local bookings.',
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="dark"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(35, 38, 47, 0.7)"
        />
        <View style={styles.overlayTint} />
        <View style={styles.card}>
          <Stars
            style={styles.sparkleTopRight}
            width={RFPercentage(6.5)}
            height={RFPercentage(7.5)}
          />
          <Stars
            style={styles.sparkleBottomLeftBig}
            width={RFPercentage(5.5)}
            height={RFPercentage(7.5)}
          />

          <View style={styles.logoWrapper}>
            <LogoIcon width={RFPercentage(10)} height={RFPercentage(7.2)} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.85}>
              <Text style={styles.skipButtonText}>Skip Tour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={onNext}
              activeOpacity={0.85}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WelcomeCoachMark;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(2.5),
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 38, 47, 0.34)',
  },
  card: {
    width: '100%',
    maxWidth: RFPercentage(38),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.8),
    paddingTop: RFPercentage(2.2),
    paddingBottom: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(2.2),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: RFPercentage(1.2)},
    shadowOpacity: 0.14,
    shadowRadius: RFPercentage(3),
    elevation: 10,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: RFPercentage(1.4),
  },
  title: {
    textAlign: 'center',
    fontSize: RFPercentage(1.75),
    fontFamily: Fonts.fontMedium,
    color: '#242B37',
    marginBottom: RFPercentage(0.5),
  },
  subtitle: {
    textAlign: 'center',
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.6),
    color: '#9CA3AF',
    fontFamily: Fonts.fontMedium,
    paddingHorizontal: RFPercentage(1),
    marginBottom: RFPercentage(1.8),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RFPercentage(1.5),
  },
  skipButton: {
    flex: 1,
    minHeight: RFPercentage(5),
    borderRadius: RFPercentage(4),
    borderWidth: 1.5,
    borderColor: '#A5A9B0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  skipButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#A5A9B0',
  },
  nextButton: {
    flex: 1,
    minHeight: RFPercentage(5),
    borderRadius: RFPercentage(4),
    backgroundColor: '#4E7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.white,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: RFPercentage(0.3),
    right: RFPercentage(0.1),
    opacity: 0.9,
  },
  sparkleBottomLeftBig: {
    position: 'absolute',
    left: RFPercentage(-1),
    bottom: RFPercentage(5),
    opacity: 0.9,
  },
});