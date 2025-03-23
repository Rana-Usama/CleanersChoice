import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import GradientButton from './GradientButton';
import NextButton from './NextButton';
import {Colors, Fonts} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import AntDesign from 'react-native-vector-icons/AntDesign';

interface props {
  title: string;
  passwordModal?: boolean;
  onPress3?: () => void;
  onPress?: () => void;
  onPress2?: () => void; 
}

const CustomModal = (props : props) => {
  return (
    <View style={styles.modalContainer}>
      {props.passwordModal && (
        <AntDesign
          name="checkcircleo"
          color={Colors.gradient1}
          size={RFPercentage(5)}
        />
      )}
      <Text style={styles.modalText}>{props.title}</Text>
      {props.passwordModal ? (
        <View style={styles.okButtonContainer}>
          <GradientButton title="Ok" onPress={props.onPress3} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <NextButton
            title="Cancel"
            style={styles.buttonWidth}
            onPress={props.onPress}
          />
          <GradientButton
            title="Yes"
            onPress={props.onPress2}
            style={styles.buttonWidth}
          />
        </View>
      )}
    </View>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: RFPercentage(38),
    borderRadius: RFPercentage(2),
    backgroundColor: 'rgb(232, 243, 252)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    paddingHorizontal: 16,
    top: RFPercentage(40),
    paddingVertical: RFPercentage(4),
  },
  modalText: {
    textAlign: 'center',
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: '#4B5563',
    marginTop: RFPercentage(1.5),
    marginHorizontal: RFPercentage(2),
    lineHeight: RFPercentage(2.6),
  },
  okButtonContainer: {
    marginTop: RFPercentage(2),
  },
  buttonContainer: {
    marginTop: RFPercentage(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '88%',
  },
  buttonWidth: {
    width: RFPercentage(14),
  },
});
