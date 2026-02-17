import {StyleSheet, Text, View, Dimensions} from 'react-native';
import React from 'react';
import GradientButton from './GradientButton';
import NextButton from './NextButton';
import {Colors, Fonts} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

interface props {
  title: string;
  passwordModal?: boolean;
  onPress3?: () => void;
  onPress?: () => void;
  onPress2?: () => void;
  loader?: boolean;
  subTitle: string;
  buttonTitle?: string;
}

const CustomModal = (props: props) => {
  return (
    <View style={styles.modalContainer}>
      {/* Icon */}
      {props.passwordModal && (
        <View style={styles.iconContainer}>
          <AntDesign
            name="checkcircle"
            color="#10B981"
            size={RFPercentage(5)}
          />
        </View>
      )}

      {/* Title */}
      <Text style={styles.modalTitle}>{props.title}</Text>

      {/* Subtitle */}
      <Text style={styles.modalText}>{props.subTitle}</Text>

      {/* Action Buttons */}
      {props.passwordModal ? (
        <View style={styles.okButtonContainer}>
          <GradientButton
            title="Ok"
            onPress={props.onPress3 ?? (() => {})}
            style={styles.okButton}
            textStyle={styles.okButtonText}
          />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <NextButton
            title="Cancel"
            onPress={props.onPress ?? (() => {})}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <GradientButton
            title={props.buttonTitle ? props.buttonTitle : 'Yes'}
            onPress={props.onPress2 ?? (() => {})}
            loading={props.loader}
            disabled={props.loader}
            style={styles.yesButton}
            textStyle={styles.yesButtonText}
          />
        </View>
      )}
    </View>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: width * 0.85,
    maxWidth: RFPercentage(42),
    borderRadius: RFPercentage(2.5),
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    borderBottomWidth:3
  },
  iconContainer: {
    marginBottom: RFPercentage(2),
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(3.5),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  modalTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.1),
    textAlign: 'center',
    marginBottom: RFPercentage(1),
    lineHeight: RFPercentage(2.8),
  },
  modalText: {
    textAlign: 'center',
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(3),
    lineHeight: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(1),
  },
  okButtonContainer: {
    marginTop: RFPercentage(1),
    width: '100%',
  },
  okButton: {
    width: '100%',
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(1.3),
  },
  okButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  buttonContainer: {
    marginTop: RFPercentage(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: RFPercentage(1.5),
  },
  cancelButton: {
    height: RFPercentage(5.3),
    borderRadius: RFPercentage(100),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.gradient1,
    width: RFPercentage(16),
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  yesButton: {
    width: RFPercentage(16),
    height: RFPercentage(5.3),
    borderRadius: RFPercentage(100),
  },
  yesButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
});
