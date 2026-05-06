import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Fonts, Icons} from '../constants/Themes';

import Stars from '../assets/svg/Stars';
import HomeIcon from '../assets/svg/homeicon';
import MessageIcon from '../assets/svg/iconmessage';
import LocationIcon from '../assets/svg/iconlocation';

interface CustomerCoachMarksProps {
  visible: boolean;
  onSkip: () => void;
  onNext: () => void;
  title?: string;
  subtitle?: string;
}

type CoachStepTab =
  | 'messages'
  | 'job-board'
  | 'home'
  | 'settings'
  | 'profile';

type CoachStep = {
  stepLabel: string;
  title: string;
  subtitle: string;
  iconType: 'home' | 'plus' | 'message' | 'job-board' | 'settings' | 'profile' | 'bell';
  variant?: 'tab' | 'cta' | 'header-action';
  activeTab?: CoachStepTab;
  cardBottomOffset?: number;
  cardTopOffset?: number;
  cardTranslateX: number;
  pointerAlignment: 'center' | 'left';
  pointerLeftOffset?: number;
  headerPreviewTopOffset?: number;
  headerPreviewRightOffset?: number;
  skipPillBottomOffset?: number;
  ctaLabel?: string;
  ctaTopOffset?: number;
  ctaLeftOffset?: number;
};

const CustomerCoachMarks: React.FC<CustomerCoachMarksProps> = ({
  visible,
  onSkip,
  onNext,
  title = 'Welcome to Cleaners Choice',
  subtitle = 'Find trusted cleaners near you, compare offers, and book in minutes.',
}) => {
  const insets = useSafeAreaInsets();
  const {width: screenWidth} = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(22)).current;

  // Initial fade-in when the modal opens
  useEffect(() => {
    if (!visible) return;
    cardOpacity.setValue(0);
    cardSlide.setValue(22);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  // On Android, insets.top can be 0 inside a statusBarTranslucent Modal.
  // Use StatusBar.currentHeight as a reliable fallback.
  const topInset =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? insets.top)
      : insets.top;

  // Pointer left = center of tab n (0-indexed) minus card anchor, accounting for card translateX.
  // Tab bar container is full-screen-width (absolute ignores parent padding);
  // 95%-wide content is centered → slot n center = screenWidth × (0.025 + (n+0.5)×0.19)
  // Card left from screen = RFPercentage(3.5); triangle half-width = RFPercentage(1.5)
  const tabPointerLeft = (tabIndex: number, cardTranslateX: number = 0): number =>
    screenWidth * (0.025 + (tabIndex + 0.5) * 0.19) - RFPercentage(5) - cardTranslateX;

  // Pointer for header-action: preview bubble is positioned with `right: previewRightOffset`
  // (absolute, so from screen right edge). Preview button width = RFPercentage(4.5).
  const headerPointerLeft = (previewRightOffset: number, cardTranslateX: number = 0): number =>
    screenWidth - previewRightOffset - RFPercentage(7.25) - cardTranslateX;

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible]);

  // Animate old card out → swap step → animate new card in
  const animateToStep = (newIndex: number, afterSwap?: () => void) => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: -10,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStepIndex(newIndex);
      afterSwap?.();
      cardSlide.setValue(22);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const coachSteps: CoachStep[] = [
    {
      stepLabel: 'Step 01 of 7',
      title: 'Welcome to Your Dashboard!',
      subtitle:
        'Find nearby cleaners or post a job to get offers fast.',
      iconType: 'home',
      variant: 'tab',
      activeTab: 'home',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: 0,
      pointerAlignment: 'center',
    },
    {
      stepLabel: 'Step 02 of 7',
      title: 'Post a Job',
      subtitle: 'Describe your needs and get price offers from nearby providers.',
      iconType: 'plus',
      variant: 'cta',
      cardTopOffset: RFPercentage(27),
      cardTranslateX: 0,
      pointerAlignment: 'left',
      pointerLeftOffset: RFPercentage(5.1),
      ctaLabel: 'Post a Job',
      ctaTopOffset: RFPercentage(58),
      ctaLeftOffset: RFPercentage(3.8),
    },
    {
      stepLabel: 'Step 03 of 7',
      title: 'Stay Connected With Cleaners',
      subtitle:
        'Respond quickly and keep all your bookings organized in one place.',
      iconType: 'message',
      variant: 'tab',
      activeTab: 'messages',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: -RFPercentage(2.5),
      pointerAlignment: 'left',
      pointerLeftOffset: tabPointerLeft(0, -RFPercentage(2.5)),
    },
    {
      stepLabel: 'Step 04 of 7',
      title: 'Manage Your Jobs',
      subtitle:
        'Track applications, review cleaners, and easily confirm your choice.',
      iconType: 'job-board',
      variant: 'tab',
      activeTab: 'job-board',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: 0,
      pointerAlignment: 'left',
      pointerLeftOffset: tabPointerLeft(1),
    },
    {
      stepLabel: 'Step 05 of 7',
      title: 'Manage Your Account',
      subtitle:
        'Manage your account, password, settings, and FAQs in one place.',
      iconType: 'settings',
      variant: 'tab',
      activeTab: 'settings',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: 0,
      pointerAlignment: 'left',
      pointerLeftOffset: tabPointerLeft(3),
    },
    {
      stepLabel: 'Step 06 of 7',
      title: 'Manage Your Profile',
      subtitle:
        'Keep your information updated so cleaners can easily contact with you.',
      iconType: 'profile',
      variant: 'tab',
      activeTab: 'profile',
      cardBottomOffset: RFPercentage(15.5),
      cardTranslateX: RFPercentage(2.5),
      pointerAlignment: 'left',
      pointerLeftOffset: tabPointerLeft(4, RFPercentage(2.5)),
    },
    {
      stepLabel: 'Step 07 of 7',
      title: 'Stay Notified',
      subtitle:
        'Get real-time updates on job offers, bookings, and messages from cleaners.',
      iconType: 'bell',
      variant: 'header-action',
      cardTopOffset: RFPercentage(10.8),
      cardTranslateX: RFPercentage(0.6),
      pointerAlignment: 'left',
      pointerLeftOffset: headerPointerLeft(RFPercentage(8.2), RFPercentage(0.6)),
      headerPreviewTopOffset: RFPercentage(1.8),
      headerPreviewRightOffset: RFPercentage(8.2),
      skipPillBottomOffset: RFPercentage(20),
    },
  ];

  const currentCoachStep = stepIndex > 0 ? coachSteps[stepIndex - 1] : null;

  const handleSkip = () => {
    setStepIndex(0);
    onSkip();
  };

  const handleNextStep = () => {
    if (stepIndex === 0) {
      animateToStep(1);
      return;
    }

    if (stepIndex < coachSteps.length) {
      animateToStep(stepIndex + 1);
      return;
    }

    // Last step: exit-only animation then complete.
    // Do NOT call animateToStep(0, onNext) — that would start a new enter
    // animation on views that are about to unmount, causing a blank screen on Android.
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: -10,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNext();
    });
  };

  const handlePreviousStep = () => {
    if (stepIndex > 1) {
      animateToStep(stepIndex - 1);
      return;
    }

    animateToStep(0);
  };

  const renderCustomerTabBarPreview = (activeTab: CoachStepTab) => {
    const customerTabs = [
      {key: 'messages', label: 'Messages'},
      {key: 'job-board', label: 'Job Board'},
      {key: 'home', label: 'Home'},
      {key: 'settings', label: 'Settings'},
      {key: 'profile', label: 'Profile'},
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
          {customerTabs.map(tab => {
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
                ) : tab.key === 'job-board' ? (
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
                ) : tab.key === 'settings' ? (
                  <Image
                    source={isFocused ? Icons.settingActive : Icons.settings}
                    style={styles.tabBarPreviewIcon}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={isFocused ? Icons.profileActive : Icons.profile}
                    style={styles.tabBarPreviewIcon}
                    resizeMode="contain"
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

  const renderCoachStepIcon = (step: CoachStep) => {
    if (step.iconType === 'plus') {
      return (
        <MaterialCommunityIcons
          name="plus"
          size={RFPercentage(2.1)}
          color="#407BFF"
        />
      );
    }

    if (step.iconType === 'message') {
      return (
        <MessageIcon
          width={RFPercentage(2.1)}
          height={RFPercentage(2.1)}
        />
      );
    }

    if (step.iconType === 'bell') {
      return (
        <MaterialCommunityIcons
          name="bell-outline"
          size={RFPercentage(2.1)}
          color="#407BFF"
        />
      );
    }

    if (step.iconType === 'profile') {
      return (
        <Image
          source={Icons.profileActive}
          style={{width: RFPercentage(2.1), height: RFPercentage(2.1)}}
          resizeMode="contain"
        />
      );
    }

    if (step.iconType === 'settings') {
      return (
        <MaterialCommunityIcons
          name="cog-outline"
          size={RFPercentage(2.1)}
          color="#407BFF"
        />
      );
    }

    if (step.iconType === 'job-board') {
      return (
        <LocationIcon
          width={RFPercentage(2.1)}
          height={RFPercentage(2.1)}
        />
      );
    }

    return (
      <HomeIcon
        width={RFPercentage(1.9)}
        height={RFPercentage(1.9)}
      />
    );
  };

  const renderCoachCard = (step: CoachStep, positionStyle: object, pointerBaseStyle: object) => (
    <Animated.View
      style={[
        styles.dashboardCard,
        positionStyle,
        {opacity: cardOpacity, transform: [{translateX: step.cardTranslateX}, {translateY: cardSlide}]},
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
        <View style={styles.dashboardIconCircle}>{renderCoachStepIcon(step)}</View>

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
          <Text style={styles.dashboardNextButtonText}>
            {step.stepLabel === 'Step 07 of 7' ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          pointerBaseStyle,
          step.pointerAlignment === 'left'
            ? step.pointerLeftOffset !== undefined
              ? {left: step.pointerLeftOffset}
              : styles.dashboardCardPointerLeft
            : styles.dashboardCardPointerCenter,
        ]}
      />
    </Animated.View>
  );

  const renderStepSkipPill = () => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleSkip}
      style={[
        styles.skipPill,
        {
          top: topInset + RFPercentage(2),
        },
      ]}>
      <Text style={styles.skipPillText}>Skip</Text>
    </TouchableOpacity>
  );

  const renderIntroStep = () => (
    <View style={styles.centeredContent}>
      <Animated.View
        style={[styles.card, {opacity: cardOpacity, transform: [{translateY: cardSlide}]}]}>
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
          <Image
            source={require('../assets/images/logo.png')}
            style={{width: RFPercentage(10), height: RFPercentage(7.2), resizeMode: 'contain'}}
          />
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
      </Animated.View>
    </View>
  );

  const renderHeaderActionCoachStep = (step: CoachStep) => (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.headerActionPreview,
          {
            top:
              topInset +
              (step.headerPreviewTopOffset ?? RFPercentage(1.8)),
            right: step.headerPreviewRightOffset ?? RFPercentage(8.2),
          },
        ]}>
        <MaterialCommunityIcons
          name="bell-outline"
          size={RFPercentage(2.4)}
          color={Colors.white}
        />
      </View>

      {renderCoachCard(
        step,
        {
          top: topInset + (step.cardTopOffset ?? RFPercentage(10.8)),
        },
        styles.dashboardCardPointerTop,
      )}

      <View
        style={[
          styles.skipPillCenterContainer,
          {
            bottom: insets.bottom + (step.skipPillBottomOffset ?? RFPercentage(20)),
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSkip}
          style={styles.skipPillCentered}>
          <Text style={styles.skipPillText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderHeaderCoachStep = (step: CoachStep) => renderHeaderActionCoachStep(step);

  const renderTabCoachStep = (step: CoachStep) => (
    <>
      {renderStepSkipPill()}
      {step.activeTab ? renderCustomerTabBarPreview(step.activeTab) : null}
      {renderCoachCard(
        step,
        {
          bottom: insets.bottom + (step.cardBottomOffset ?? RFPercentage(15.5)),
        },
        styles.dashboardCardPointer,
      )}
    </>
  );

  const renderPostJobCoachStep = (step: CoachStep) => (
    <>
      {renderStepSkipPill()}

      <View
        pointerEvents="none"
        style={[
          styles.postJobPreviewButton,
          {
            top: topInset + (step.ctaTopOffset ?? RFPercentage(63)),
            left: step.ctaLeftOffset ?? RFPercentage(0.9),
          },
        ]}>
        <Text style={styles.postJobPreviewText}>
          {step.ctaLabel ?? 'Post a Job'}
        </Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={RFPercentage(2.4)}
          color="#407BFF"
        />
      </View>

      {renderCoachCard(
        step,
        {
          top: topInset + (step.cardTopOffset ?? RFPercentage(33)),
        },
        styles.dashboardCardPointer,
      )}
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
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="light"
            blurAmount={8}
            reducedTransparencyFallbackColor="rgba(35, 38, 47, 0.5)"
          />
        )}
        <View style={styles.overlayTint} />
        {stepIndex === 0
          ? renderIntroStep()
          : currentCoachStep
            ? currentCoachStep.variant === 'cta'
              ? renderPostJobCoachStep(currentCoachStep)
              : currentCoachStep.variant === 'header-action'
              ? renderHeaderActionCoachStep(currentCoachStep)
              : renderTabCoachStep(currentCoachStep)
            : null}
      </View>
    </Modal>
  );
};

export default CustomerCoachMarks;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: RFPercentage(2.5),
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? 'rgba(35, 38, 47, 0.82)' : 'rgba(35, 38, 47, 0.34)',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
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
    fontSize: RFPercentage(2.0),
    fontFamily: Fonts.fontMedium,
    color: '#242B37',
    marginBottom: RFPercentage(0.5),
  },
  subtitle: {
    textAlign: 'center',
    fontSize: RFPercentage(1.75),
    lineHeight: RFPercentage(2.6),
    color: '#9CA3AF',
    fontFamily: Fonts.fontRegular,
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
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    zIndex: 3,
  },
  skipPillText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    textDecorationLine: 'underline',
  },
  postJobPreviewButton: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(1),
    minHeight: RFPercentage(5.6),
    width: RFPercentage(15.4),
    borderRadius: RFPercentage(100),
    paddingHorizontal: RFPercentage(1.8),
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: RFPercentage(0.8)},
    shadowOpacity: 0.08,
    shadowRadius: RFPercentage(1.8),
    elevation: 5,
    zIndex: 3,
  },
  postJobPreviewText: {
    color: '#407BFF',
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2.2),
    includeFontPadding: false,
    fontFamily: Fonts.semiBold,
  },
  dashboardCard: {
    position: 'absolute',
    left: RFPercentage(3.5),
    right: RFPercentage(3.5),
    minHeight: RFPercentage(23.5),
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
    lineHeight: RFPercentage(1.9),
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: Fonts.fontMedium,
  },
  dashboardCopyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexGrow: 1,
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
    paddingRight: RFPercentage(1.0),
  },
  dashboardTitle: {
    color: '#242B37',
    fontSize: RFPercentage(2.0),
    fontFamily: Fonts.fontMedium,
    marginTop: RFPercentage(0.2),
  },
  dashboardSubtitle: {
    marginTop: RFPercentage(0.7),
    color: '#A5A9B0',
    fontSize: RFPercentage(1.75),
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
  headerActionPreview: {
    position: 'absolute',
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(10),
    backgroundColor: Colors.whiteOverlay20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  skipPillCenterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  skipPillCentered: {
    minWidth: RFPercentage(12),
    minHeight: RFPercentage(4),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
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
  dashboardCardPointerTop: {
    position: 'absolute',
    top: RFPercentage(-1.55),
    width: 0,
    height: 0,
    borderLeftWidth: RFPercentage(1.5),
    borderRightWidth: RFPercentage(1.5),
    borderBottomWidth: RFPercentage(1.9),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.white,
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
    backgroundColor: 'rgba(241,245,249,1)',
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