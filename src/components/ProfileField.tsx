import {Image, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Entypo from 'react-native-vector-icons/Entypo';

interface Props {
  onPress: () => void;
  icon: any;
  color?: string;
  text: string;
}

const ProfileField: React.FC<Props> = (props: Props) => {
  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.8}>
      <View style={[styles.container]}>
        <View style={styles.textContainer}>
          <Image
            source={props.icon}
            resizeMode="contain"
            tintColor={props.color ? props.color : null}
            style={styles.icon}
          />
          <Text style={[styles.text, props.color && {color: props.color}]}>
            {props.text}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={props.onPress}>
          <Entypo
            name="chevron-thin-right"
            size={RFPercentage(1.6)}
            color={props.color ? props.color : Colors.brown}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileField;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: RFPercentage(6.3),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(1.3),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RFPercentage(2),
    marginVertical: RFPercentage(1),
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    bottom:1
  },
  text: {
    color: Colors.brown,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    left: RFPercentage(1),
    lineHeight: Platform.OS === 'ios' ?  RFPercentage(1.9) : RFPercentage(2.3)
  },
});
