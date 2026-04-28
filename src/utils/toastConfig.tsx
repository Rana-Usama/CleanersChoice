// toastConfig.tsx
import React from 'react';
import {Text, View, StyleSheet, Dimensions} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '../constants/Themes';

const {width} = Dimensions.get('window');

interface ToastProps {
  text1?: string;
  text2?: string;
}

const baseToastStyle = {
  borderLeftWidth: RFPercentage(1.5),
  paddingHorizontal: RFPercentage(2),
  paddingVertical: RFPercentage(2),
  borderRadius: RFPercentage(1),
  marginHorizontal: RFPercentage(2),
};

export const toastConfig = {
  success: ({text1, text2}: ToastProps) => (
    <View style={[styles.toastContainer, styles.success]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  error: ({text1, text2}: ToastProps) => (
    <View style={[styles.toastContainer, styles.error]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  info: ({text1, text2}: ToastProps) => (
    <View style={[styles.toastContainer, styles.info]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    ...baseToastStyle,
    width: width * 0.85,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
    borderRightWidth: 1,
    borderRightColor: Colors.inputFieldColor,
    borderTopWidth: 1,
    borderTopColor: Colors.inputFieldColor,
  },
  success: {
    backgroundColor: Colors.white,
    borderLeftColor: Colors.gradient1,
  },
  error: {
    backgroundColor: Colors.white,
    borderLeftColor: Colors.toastError,
  },
  info: {
    backgroundColor: Colors.white,
    borderLeftColor: Colors.toastInfo,
  },
  text1: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.black,
  },
  text2: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.black,
  },
});
