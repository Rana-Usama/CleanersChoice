import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Fonts, Icons} from '../constants/Themes';
import LogoIcon from '../assets/svg/LogoIcon';
import Stars from '../assets/svg/Stars';

interface WelcomeCoachMarkProps {
  visible: boolean;
  onSkip: () => void;
  onNext: () => void;
  title?: string;
  subtitle?: string;
}

type TabCoachStep = {
  stepLabel: string;
  title: string;
  subtitle: string;
  iconName: string;
  activeTab: 'messages' | 'job-list' | 'home' | 'invoices' | 'my-jobs';
  cardBottomOffset: number;
  cardTranslateX: number;
  pointerAlignment: 'center' | 'left';
};

const WelcomeCoachMark: React.FC<WelcomeCoachMarkProps> = ({
  visible,
  onSkip,
  onNext,
  title = 'Welcome to Cleaners Choice',
  subtitle = 'Set up your profile and showcase services to get local bookings.',
}) => {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible]);

  const tabCoachSteps: TabCoachStep[] = [
    {
      stepLabel: 'Step 01 of 7',
      title: 'Welcome to Your Dashboard!',
      subtitle: 'Edit profile, manage services, and control what clients see.',
      iconName: 'home-outline',
      activeTab: 'home',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: 0,
      pointerAlignment: 'center',
    },
    {
      stepLabel: 'Step 02 of 7',
      title: 'Stay Connected With Customer',
      subtitle:
        'All client chats in one place. Reply fast and never miss a booking.',
      iconName: 'chatbubble-ellipses-outline',
      activeTab: 'messages',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: -RFPercentage(2),
      pointerAlignment: 'left',
    },
  ];

  const currentTabCoachStep = stepIndex > 0 ? tabCoachSteps[stepIndex - 1] : null;

  const handleSkip = () => {
    setStepIndex(0);
    onSkip();
  };

  const handleNextStep = () => {
    if (stepIndex === 0) {
      setStepIndex(1);
      return;
    }

    if (stepIndex < tabCoachSteps.length) {
      setStepIndex(prev => prev + 1);
      return;
    }

    setStepIndex(0);
    onNext();
  };

  const handlePreviousStep = () => {
    if (stepIndex > 1) {
      setStepIndex(prev => prev - 1);
      return;
    }

    setStepIndex(0);
  };

  const renderCleanerTabBarPreview = (
    activeTab: TabCoachStep['activeTab'],
  ) => {
    const cleanerTabs = [
      {key: 'messages', label: 'Messages'},
      {key: 'job-list', label: 'Job List'},
      {key: 'home', label: 'Home'},
      {key: 'invoices', label: 'Invoices'},
      {key: 'my-jobs', label: 'My Jobs'},
    ];

    return (
      <View
        pointerEvents="none"
        style={[
          styles.tabBarPreviewContainer,
          {
            height: RFPercentage(9) + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}>
        <View style={styles.tabBarPreviewContent}>
          {cleanerTabs.map(tab => {
            const isHome = tab.key === 'home';
            const isFocused = tab.key === activeTab;

            return (
              <View key={tab.key} style={styles.tabBarPreviewItem}>
                {tab.key === 'messages' ? (
                  <Image
                    source={isFocused ? Icons.msgActive : Icons.msg}
                    style={styles.tabBarPreviewIcon}
                    resizeMode="contain"
                  />
                ) : tab.key === 'job-list' ? (
                  <Image
                    source={isFocused ? Icons.jobActive : Icons.job}
                    style={styles.tabBarPreviewIcon}
                    resizeMode="contain"
                  />
                ) : isHome ? (
                  <View
                    style={{
                      bottom:
                        Platform.OS === 'android'
                          ? RFPercentage(3)
                          : RFPercentage(2.5),
                    }}>
                    <Image
                      source={isFocused ? Icons.home : Icons.homeInactive}
                      style={styles.tabBarPreviewHomeIcon}
                      resizeMode="contain"
                    />
                  </View>
                ) : tab.key === 'invoices' ? (
                  <Ionicons
                    name="document-text-outline"
                    size={RFPercentage(2.5)}
                    color={isFocused ? Colors.gradient2 : Colors.secondaryText}
                  />
                ) : (
                  <Ionicons
                    name="briefcase-outline"
                    size={RFPercentage(2.5)}
                    color={isFocused ? Colors.gradient2 : Colors.secondaryText}
                  />
                )}

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabBarPreviewLabel,
                    {
                      color: isFocused ? Colors.gradient2 : Colors.secondaryText,
                      top: isHome ? RFPercentage(-2.1) : RFPercentage(0.5),
                    },
                  ]}>
                  {tab.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderIntroStep = () => (
    <View style={styles.centeredContent}>
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
            onPress={handleSkip}
            activeOpacity={0.85}>
            <Text style={styles.skipButtonText}>Skip Tour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
            activeOpacity={0.85}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabCoachStep = (step: TabCoachStep) => (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSkip}
        style={[
          styles.skipPill,
          {
            top: insets.top + RFPercentage(2),
          },
        ]}>
        <Text style={styles.skipPillText}>Skip</Text>
      </TouchableOpacity>

      {renderCleanerTabBarPreview(step.activeTab)}

      <View
        style={[
          styles.dashboardCard,
          {
            bottom: insets.bottom + step.cardBottomOffset,
            transform: [{translateX: step.cardTranslateX}],
          },
        ]}>
        <Stars
          style={styles.dashboardSparkle}
          width={RFPercentage(6.1)}
          height={RFPercentage(6.8)}
        />

        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>{step.stepLabel}</Text>
        </View>

        <View style={styles.dashboardCopyRow}>
          <View style={styles.dashboardIconCircle}>
            <Ionicons
              name={step.iconName}
              size={RFPercentage(2.3)}
              color={Colors.gradient1}
            />
          </View>

          <View style={styles.dashboardCopyBlock}>
            <Text style={styles.dashboardTitle}>{step.title}</Text>
            <Text style={styles.dashboardSubtitle}>{step.subtitle}</Text>
          </View>
        </View>

        <View style={styles.dashboardButtonRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePreviousStep}
            style={styles.previousButton}>
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNextStep}
            style={styles.dashboardNextButton}>
            <Text style={styles.dashboardNextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.dashboardCardPointer,
            step.pointerAlignment === 'left'
              ? styles.dashboardCardPointerLeft
              : styles.dashboardCardPointerCenter,
          ]}
        />
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="dark"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(35, 38, 47, 0.7)"
        />
        <View style={styles.overlayTint} />
        {stepIndex === 0
          ? renderIntroStep()
          : currentTabCoachStep
            ? renderTabCoachStep(currentTabCoachStep)
            : null}
      </View>
    </Modal>
  );
};

export default WelcomeCoachMark;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: RFPercentage(2.5),
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 38, 47, 0.34)',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: RFPercentage(5.2),
    borderRadius: RFPercentage(4),
    borderWidth: 1,
    borderColor: '#A5A9B0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  skipButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: '#A5A9B0',
  },
  nextButton: {
    flex: 1,
    minHeight: RFPercentage(5.2),
    borderRadius: RFPercentage(4),
    backgroundColor: '#4E7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: RFPercentage(1.7),
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
  skipPill: {
    position: 'absolute',
    right: RFPercentage(2.4),
    minWidth: RFPercentage(12),
    minHeight: RFPercentage(4),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    zIndex: 3,
  },
  skipPillText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    textDecorationLine: 'underline',
  },
  dashboardCard: {
    position: 'absolute',
    left: RFPercentage(3.5),
    right: RFPercentage(3.5),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2.8),
    paddingHorizontal: RFPercentage(2.2),
    paddingTop: RFPercentage(1.7),
    paddingBottom: RFPercentage(1.5),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: RFPercentage(1.1)},
    shadowOpacity: 0.16,
    shadowRadius: RFPercentage(2.8),
    elevation: 12,
    zIndex: 4,
  },
  dashboardSparkle: {
    position: 'absolute',
    top: RFPercentage(0.2),
    right: RFPercentage(0.2),
    opacity: 0.9,
  },
  stepPill: {
    alignSelf: 'flex-start',
    minHeight: RFPercentage(3.5),
    paddingHorizontal: RFPercentage(1.4),
    borderRadius: RFPercentage(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AFB2B9',
    marginBottom: RFPercentage(1.25),
  },
  stepPillText: {
    color: Colors.white,
    fontSize: RFPercentage(1.40),
    fontFamily: Fonts.fontMedium,
  },
  dashboardCopyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: RFPercentage(8.3),
  },
  dashboardIconCircle: {
    width: RFPercentage(4.3),
    height: RFPercentage(4.3),
    borderRadius: RFPercentage(2.8),
    backgroundColor: '#4D85FE33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.5),
  },
  dashboardCopyBlock: {
    flex: 1,
    paddingRight: RFPercentage(2.5),
  },
  dashboardTitle: {
    color: '#242B37',
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    marginTop: RFPercentage(0.2),
  },
  dashboardSubtitle: {
    marginTop: RFPercentage(0.7),
    color: '#A5A9B0',
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.6),
    fontFamily: Fonts.fontRegular,
  },
  dashboardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RFPercentage(1.5),
    marginTop: RFPercentage(1.7),
  },
  previousButton: {
    flex: 1,
    minHeight: RFPercentage(5.2),
    borderRadius: RFPercentage(4),
    borderWidth: 1,
    borderColor: '#B9C1CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  previousButtonText: {
    color: '#B0B7C3',
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  dashboardNextButton: {
    flex: 1,
    minHeight: RFPercentage(5.2),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4E7EFF',
  },
  dashboardNextButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  dashboardCardPointer: {
    position: 'absolute',
    bottom: RFPercentage(-1.55),
    width: 0,
    height: 0,
    borderLeftWidth: RFPercentage(1.5),
    borderRightWidth: RFPercentage(1.5),
    borderTopWidth: RFPercentage(1.9),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
  },
  dashboardCardPointerCenter: {
    alignSelf: 'center',
  },
  dashboardCardPointerLeft: {
    left: RFPercentage(2.8),
  },
  tabBarPreviewContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  tabBarPreviewContent: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: RFPercentage(9),
    bottom: RFPercentage(0.5),
  },
  tabBarPreviewItem: {
    alignItems: 'center',
    width: RFPercentage(8),
  },
  tabBarPreviewIcon: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
  },
  tabBarPreviewHomeIcon: {
    width: RFPercentage(7.5),
    height: RFPercentage(7.5),
  },
  tabBarPreviewLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
});