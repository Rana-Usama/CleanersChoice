import React from 'react';
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native';
import {BlurView} from '@react-native-community/blur';

interface ModalWrapperProps {
  visible: boolean;
  onBackdropPress?: () => void;
  blurAmount?: number;
  children: React.ReactNode;
}

const ModalWrapper = ({
  visible,
  onBackdropPress,
  blurAmount = 5,
  children,
}: ModalWrapperProps) => {
  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onBackdropPress}>
      <View style={styles.overlay}>
        <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor="white"
        />
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ModalWrapper;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
