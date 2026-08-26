import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Feather from 'react-native-vector-icons/Feather';
import GradientButton from './GradientButton';

/**
 * Cleaner Membership Terms, shown from the Sign-Up screen.
 *
 * Read-only by design: the agreement itself is still the checkbox on Sign-Up,
 * so this sheet never mutates that state. Structure and styling mirror
 * MarkAsPaidSheet so the app has one bottom-sheet language.
 */

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

/** Copy lives here so it can be reused or revised in one place. */
const TERMS_PARAGRAPHS: string[] = [
  'The Premium Package is our membership program. Your membership gives you access to our job list, including potential customers who contact Cleaners Choice by phone or submit a form and are located within a 50-mile radius of your service area.',
  'Your membership also includes access to our Invoicing System and Phone Book.',
  'This app was developed as a tool to help you manage and find potential cleaning opportunities. Please make sure your cleaner profile is completed to 100%. If your profile is not 100% complete, our admins may not be able to see you when looking for cleaners.',
  'If your profile is not visible and we receive a job in your area, we will continue looking for other available cleaners in that area.',
];

const CONSENT_LINE =
  'By tapping “I Agree,” you confirm that you have read, understood, and agree to these terms.';

const CleanerTermsSheet: React.FC<Props> = ({visible, onClose}) => {
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_MAX_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          {/* <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View> */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeBtn}>
            <Feather
              name="x"
              size={RFPercentage(2.4)}
              color={Colors.secondaryText}
            />
          </TouchableOpacity>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Cleaner Membership Terms</Text>
              <Text style={styles.subtitle}>
                Please read before creating your account
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {TERMS_PARAGRAPHS.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}

            <View style={styles.consentBox}>
              <Text style={styles.consentText}>{CONSENT_LINE}</Text>
            </View>
          </ScrollView>

          <GradientButton
            title="Got It"
            onPress={onClose}
            style={styles.closeButton}
            textStyle={styles.closeButtonText}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CleanerTermsSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blackOverlay50,
  },
  sheet: {
    maxHeight: SHEET_MAX_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(2.2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(1.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.5),
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.5),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.2),
    gap: RFPercentage(1),
    marginTop: RFPercentage(5),
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    position:"absolute",
    right:RFPercentage(2), top:RFPercentage(2)
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingBottom: RFPercentage(1.5),
  },
  paragraph: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(1.4),
  },
  consentBox: {
    backgroundColor: Colors.skyBlueBg,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(1.2),
    marginTop: RFPercentage(0.2),
  },
  consentText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.55),
    lineHeight: RFPercentage(2.3),
    color: Colors.gradient1,
  },
  closeButton: {
    marginTop: RFPercentage(1.6),
    width: '100%',
  },
  closeButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
  },
});
