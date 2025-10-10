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
  loader?: boolean;
  subTitle: string;
  buttonTitle ? : string
}

const CustomModal = (props: props) => {
  return (
    <View style={styles.modalContainer}>
      {props.passwordModal && (
        <AntDesign
          name="checkcircleo"
          color={Colors.gradient1}
          size={RFPercentage(5)}
        />
      )}
      <Text
        style={{
          color: Colors.primaryText,
          fontFamily: Fonts.fontMedium,
          fontSize: RFPercentage(2.1),
        }}>
        {props.title}
      </Text>
      <Text style={styles.modalText}>{props.subTitle}</Text>
      {props.passwordModal ? (
        <View style={styles.okButtonContainer}>
          <GradientButton title="Ok" onPress={props.onPress3} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <NextButton
            title="Cancel"
            onPress={props.onPress}
            style={{
              width: RFPercentage(14),
              height: RFPercentage(5),
              borderColor: Colors.primaryText,
            }}
            textStyle={{fontSize: RFPercentage(1.8)}}
          />
          <GradientButton
            title={props.buttonTitle ? props.buttonTitle : "Yes"}
            onPress={props.onPress2}
            loading={props.loader}
            disabled={props.loader}
            style={{width: RFPercentage(14), height: RFPercentage(5)}}
            textStyle={{fontSize: RFPercentage(1.8)}}
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
    borderRadius: RFPercentage(2.5),
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
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    color: '#4a5461ff',
    marginTop: RFPercentage(2),
    marginHorizontal: RFPercentage(2),
    lineHeight: RFPercentage(2.4),
  },
  okButtonContainer: {
    marginTop: RFPercentage(2),
  },
  buttonContainer: {
    marginTop: RFPercentage(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
});
