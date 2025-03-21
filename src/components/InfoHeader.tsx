import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '../constants/Themes';
import Feather from 'react-native-vector-icons/Feather';

interface props {
  text? : string
}

const InfoHeader = (props:props) => {
  return (
    <View style={styles.container}>
      <Feather name="info" color={Colors.gradient1} size={RFPercentage(2)} />
      <Text style={styles.text}>
        {props.text || ' List your service by providing below details'}
      </Text>
    </View>
  );
};

export default InfoHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    left: 4,
    top: 1,
  },
});
