import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {IMAGES, Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const Message = props => {
  return (
      <View style={styles.container}>
        <Image
          source={IMAGES.picture}
          resizeMode="contain"
          style={{width: RFPercentage(5), height: RFPercentage(5)}}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flex: 1,
          }}>
          <View style={{left: RFPercentage(1)}}>
            <Text
              style={{
                color: 'rgba(55, 65, 81, 1)',
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              {props.name}
            </Text>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.3),
              }}>
                {props.message}
            </Text>
          </View>
          <View>
            <Text
              style={{
                color: Colors.placeholderColor,
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.3),
              }}>
              9:17 PM
            </Text>
          </View>
        </View>
      </View>
  );
};

export default Message;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth:1,
    borderBottomColor:Colors.inputFieldColor,
    paddingBottom:RFPercentage(2),
    marginTop:RFPercentage(3)
  },
});
