import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

interface Props {
  onPress: () => void;
  icon: string;
  color?: string;
  text: string;
  style ? :object
}

const ProfileField: React.FC<Props> = (props: Props) => {
  const renderIcon = () => {
    const iconSize = RFPercentage(2.2);
    const iconColor = props.color || Colors.secondaryText
    
    if (props.icon.includes('-')) {
      return (
        <MaterialCommunityIcons
          name={props.icon as any}
          size={iconSize}
          color={iconColor}
          style={styles.icon}
        />
      );
    } else if (props.icon.startsWith('ios-') || props.icon.startsWith('md-')) {
      // Ionicons
      return (
        <Ionicons
          name={props.icon as any}
          size={iconSize}
          color={iconColor}
          style={styles.icon}
        />
      );
    } else {
      // Default to Feather for simple icons
      return (
        <Feather
          name={props.icon as any}
          size={iconSize}
          color={iconColor}
          style={styles.icon}
        />
      );
    }
  };

  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.8}>
      <View style={[styles.container, props.style]}>
        <View style={styles.textContainer}>
          {renderIcon()}
          <Text style={[styles.text, props.color && {color: props.color}]}>
            {props.text}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={props.onPress}>
          <Entypo
            name="chevron-thin-right"
            size={RFPercentage(1.6)}
            color={props.color ? props.color : Colors.secondaryText}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileField;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: RFPercentage(6.3),
    borderWidth: 1,
    borderColor: Colors.profileFieldBorder,
    borderRadius: RFPercentage(1.3),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RFPercentage(2),
    marginVertical: RFPercentage(1),
    backgroundColor: Colors.profileFieldBg,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: RFPercentage(1.5),
  },
  text: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    lineHeight: Platform.OS === 'ios' ? RFPercentage(2.3) : RFPercentage(2.3),
  },
});