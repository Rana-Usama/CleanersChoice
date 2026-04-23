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
            width={RFPercentage(4)}
            height={RFPercentage(4.5)}
          />
          <Stars
            style={styles.sparkleTopRightSmall}
            width={RFPercentage(2.2)}
            height={RFPercentage(2.5)}
          />
          <Stars
            style={styles.sparkleBottomLeftBig}
            width={RFPercentage(3.8)}
            height={RFPercentage(4.2)}
          />
          <Stars
            style={styles.sparkleBottomLeftSmall}
            width={RFPercentage(2.2)}
            height={RFPercentage(2.5)}
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
    maxWidth: RFPercentage(42),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.8),
    paddingTop: RFPercentage(3.2),
    paddingBottom: RFPercentage(2.7),
    paddingHorizontal: RFPercentage(2.2),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: RFPercentage(1.2)},
    shadowOpacity: 0.14,
    shadowRadius: RFPercentage(3),
    elevation: 10,
    overflow: 'hidden',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: RFPercentage(2.2),
  },
  title: {
    textAlign: 'center',
    fontSize: RFPercentage(1.8),
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
    marginBottom: RFPercentage(2.7),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RFPercentage(1.5),
  },
  skipButton: {
    flex: 1,
    minHeight: RFPercentage(6.3),
    borderRadius: RFPercentage(4),
    borderWidth: 1.5,
    borderColor: '#B8BEC9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  skipButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: '#A1A8B3',
  },
  nextButton: {
    flex: 1,
    minHeight: RFPercentage(6.3),
    borderRadius: RFPercentage(4),
    backgroundColor: '#4E7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontBold,
    color: Colors.white,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: RFPercentage(0.9),
    right: RFPercentage(0.7),
    opacity: 0.9,
  },
  sparkleTopRightSmall: {
    position: 'absolute',
    top: RFPercentage(3.6),
    right: RFPercentage(3.8),
    opacity: 0.6,
  },
  sparkleBottomLeftBig: {
    position: 'absolute',
    left: RFPercentage(0.1),
    bottom: RFPercentage(7),
    opacity: 0.8,
  },
  sparkleBottomLeftSmall: {
    position: 'absolute',
    left: RFPercentage(3),
    bottom: RFPercentage(10.5),
    opacity: 0.55,
  },
});