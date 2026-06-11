import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
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

/**
 * Prominent disclosure required by the Google Play User Data policy.
 * Must be shown BEFORE the runtime location permission dialog.
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
      onRequestClose={onDecline}>
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
              subTitle="Cleaner Choice collects location data to show nearby cleaning jobs and services, and to display your position on the map while you are using the app. Your location is sent to our servers to match you with jobs and cleaners in your area. We never collect location in the background."
              iconName="map-marker-outline"
              iconColor={Colors.gradient1}
              onPress={onDecline}
              onPress2={onAccept}
              buttonTitle="Allow"
              cancelButtonTitle="No Thanks"
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
