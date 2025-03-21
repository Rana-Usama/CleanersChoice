import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';

interface Props {
  stepTwo : number;
  stepThree : number
}

const TimeLine = (props:Props) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.stepOuter}>
          <View style={styles.stepInner}></View>
        </View>

        <View style={[styles.line, {backgroundColor : props.stepTwo ? Colors.gradient1 : 'rgba(209, 213, 219, 1)'}]}></View>

        <View style={styles.stepOuter}>
          <View style={styles.stepInner}></View>
        </View>

        <View style={[styles.line, {backgroundColor : props.stepThree ? Colors.gradient1 : 'rgba(209, 213, 219, 1)'}]}></View>

        <View style={styles.stepOuter}>
          <View style={styles.stepInner}></View>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.textStyle, styles.textLeft]}>Step 1</Text>
        <Text style={styles.textStyle}>Step 2</Text>
        <Text style={[styles.textStyle, styles.textRight]}>Step 3</Text>
      </View>
    </View>
  );
};

export default TimeLine;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepOuter: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderWidth: 1.5,
    borderRadius: RFPercentage(100),
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInner: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(100),
    borderColor: Colors.gradient1,
    backgroundColor: Colors.gradient1,
  },
  line: {
    width: RFPercentage(17.5),
    height: 2,
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
  textContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(0.5),
  },
  textStyle: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
  },
  textLeft: {
    right: 3,
  },
  textRight: {
    left: 3,
  },
});
