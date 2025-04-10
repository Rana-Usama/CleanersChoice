import {StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import {IMAGES, Icons, Colors, Fonts} from '../constants/Themes';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface Props {
    text : string
}

const NotFound = (props : Props) => {
  return (
    <View style={styles.noServiceContainer}>
      <Image
        source={Icons.empty}
        resizeMode="contain"
        style={styles.noServiceImg}
      />
      <Text style={styles.noServiceText}>{props.text}</Text>
    </View>
  );
};

export default NotFound;

const styles = StyleSheet.create({
  noServiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: RFPercentage(10),
  },
  noServiceImg: {
    width: RFPercentage(10),
    height: RFPercentage(10),
  },
  noServiceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
});
