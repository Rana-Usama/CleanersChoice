import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import CustomModal from './CustomModal';
import {Colors} from '../constants/Themes';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const isIOS = Platform.OS === 'ios';

const DISCLOSURE_TEXT =
  'Cleaner Choice uses your location to show nearby cleaning jobs and services, and to display your position on the map while you are using the app. Your location is sent to our servers to match you with jobs and cleaners in your area. We never collect location in the background.';

type ActionProps = Pick<
  React.ComponentProps<typeof CustomModal>,
  'singleButton' | 'buttonTitle' | 'cancelButtonTitle' | 'onPress' | 'onPress2'
>;

/**
 * iOS renders a single centred "Continue" button and nothing else, so the
 * cancel-button props are not passed at all. Android keeps the two-button
 * Allow / No Thanks layout.
 */
const buildActionProps = (
  onAccept: () => void,
  onDecline: () => void,
): ActionProps =>
  isIOS
    ? {
        singleButton: true,
        buttonTitle: 'Continue',
        onPress2: onAccept,
      }
    : {
        buttonTitle: 'Allow',
        cancelButtonTitle: 'No Thanks',
        onPress: onDecline,
        onPress2: onAccept,
      };

/**
 * Pre-permission disclosure shown before the runtime location prompt.
 *
 * iOS - App Store guideline 5.1.1(iv): the screen may only *explain* the
 * upcoming request. It must not encourage a choice ("Allow") and must not let
 * the user skip or delay the request ("No Thanks"). So on iOS we render a
 * single neutral "Continue" button and every dismissal path leads straight to
 * the system permission dialog.
 *
 * Android - Google Play Prominent Disclosure & Consent: the user must be able
 * to decline the disclosure before the runtime dialog is triggered, so both
 * buttons are kept.
 */
const LocationDisclosureModal: React.FC<Props> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      // iOS has no opt-out path, so any dismissal still proceeds to the prompt.
      onRequestClose={isIOS ? onAccept : onDecline}>
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="light"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
        />
        <TouchableWithoutFeedback>
          <View>
            <CustomModal
              title="Location Access"
              subTitle={DISCLOSURE_TEXT}
              iconName="map-marker-outline"
              iconColor={Colors.gradient1}
              {...buildActionProps(onAccept, onDecline)}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default LocationDisclosureModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
