import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import GradientButton from './GradientButton';
import NextButton from './NextButton';
import {Colors, Fonts, Icons} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import AntDesign from 'react-native-vector-icons/AntDesign';

const CustomModal = props => {
  return (
    <View
      style={{
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
      }}>
      {props.passwordModal && (
        <AntDesign
          name="checkcircleo"
          color={Colors.gradient1}
          size={RFPercentage(5)}
        />
      )}
      <Text
        style={{
          textAlign: 'center',
          fontSize: RFPercentage(1.7),
          fontFamily: Fonts.fontRegular,
          color: Colors.fieldColor,
          marginTop: RFPercentage(1.5),
          marginHorizontal: RFPercentage(3),
          lineHeight: 20,
        }}>
        {props.title}
      </Text>
      {props.passwordModal ? (
        <>
          <View style={{marginTop: RFPercentage(2)}}>
            <GradientButton title="Ok" onPress={props.onPress3} />
          </View>
        </>
      ) : (
        <>
          <View
            style={{
              marginTop: RFPercentage(3),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '88%',
            }}>
            <NextButton
              title="Cancel"
              style={{width: RFPercentage(14)}}
              onPress={props.onPress}
            />
            <GradientButton
              title="Yes"
              onPress={props.onPress2}
              style={{width: RFPercentage(14)}}
            />
          </View>
        </>
      )}
    </View>
  );
};

export default CustomModal;

const styles = StyleSheet.create({});
