import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { IMAGES, Fonts, Colors } from '../constants/Themes';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface props {
  message : string;
  name : string;
  onPress: () => void;
  image : any
}

const Message = (props:props) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={props.onPress} style={styles.container}>
      <Image source={{uri : props.image}} resizeMode="contain" style={styles.image} borderRadius={RFPercentage(100)} />
      <View style={styles.messageContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{props.name}</Text>
          <Text style={styles.messageText}>{props.message}</Text>
        </View>
        <View>
          <Text style={styles.timeText}>9:17 PM</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Message;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
    paddingBottom: RFPercentage(2),
    marginTop: RFPercentage(3),
  },
  image: {
    width: RFPercentage(5),
    height: RFPercentage(5),
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  textContainer: {
    left: RFPercentage(1),
  },
  nameText: {
    color: 'rgba(55, 65, 81, 1)',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  messageText: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
  },
  timeText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
  },
});
