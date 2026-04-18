import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import CustomModal from './CustomModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const GuestAuthModal: React.FC<Props> = ({visible, onClose, onContinue}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
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
                title="Login Required"
                subTitle="You need to sign in or create an account to access this feature."
                onPress={onClose}
                onPress2={onContinue}
                buttonTitle="Login"
                cancelButtonTitle="Cancel"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default GuestAuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
