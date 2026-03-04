import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {IMAGES, Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface props {
  message: string;
  name: string;
  onPress: () => void;
  image: any;
  time: string;
  unread: boolean;
  noProfile: any;
  customStyle? :any
}

const Message = (props: props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={props.onPress}
      style={[styles.container,props.customStyle]}>
      {props.image ? (
        <>
          <Image
            source={{uri: props.image}}
            resizeMode="contain"
            style={styles.image}
            borderRadius={RFPercentage(100)}
          />
        </>
      ) : (
        <>
          <View style={styles.noProfileContainer}>
            <Text style={styles.name}>{props.name[0]}</Text>
          </View>
        </>
      )}

      <View style={styles.messageContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{props.name}</Text>
          <Text
            style={[
              styles.messageText,
              {color: props.unread ? Colors.gradient1 : Colors.gray600},
            ]}>
            {props.message
              ? props.message
                  .replace(/\s+/g, ' ') // replace multiple spaces/newlines with a single space
                  .trim() // remove leading/trailing spaces
                  .slice(0, 30) +
                (props.message.replace(/\s+/g, ' ').trim().length > 30
                  ? '...'
                  : '')
              : ''}
          </Text>
        </View>
      </View>
      <View style={{}}>
        <Text
          style={[
            styles.timeText,
            {color: props.unread ? Colors.gradient1 : Colors.gray600},
          ]}>
          {props.time}
        </Text>
        {props.unread && (
          <>
            <View style={styles.unread}></View>
          </>
        )}
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
    paddingBottom: RFPercentage(1.6),
    marginTop: RFPercentage(3.5),
  },
  image: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  noProfileContainer: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderWidth: RFPercentage(0.2),
    borderColor: Colors.gradient1,
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grayBorderOverlay30,
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
    color: Colors.gray700,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
  },
  messageText: {
    color: Colors.gray600,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(0.3),
  },
  timeText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  unread: {
    width: RFPercentage(0.9),
    height: RFPercentage(0.9),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.pureBlue,
    position: 'absolute',
    right: 0,
    top: RFPercentage(2.7),
  },
  name: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
  },
});
