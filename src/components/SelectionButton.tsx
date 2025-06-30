import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React from 'react';
import { Fonts, Colors } from '../constants/Themes';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  title: string;
  style?: object;
  loading?: boolean;
  icon: any;
}

const SelectionButton: React.FC<Props> = (props: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      <View style={styles.iconContainer}>
        <Image source={props.icon} resizeMode="contain" style={styles.icon} />
      </View>
      <View style={[styles.nextButton, props.style]}>
        <Text style={styles.nextButtonText}>
          {props.loading ? (
            <ActivityIndicator size={'small'} color={Colors.background} />
          ) : (
            props.title
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SelectionButton;

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    zIndex: 999999,
    left: RFPercentage(0.6),
    top: RFPercentage(-1.2),
  },
  icon: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
  },
  nextButton: {
    height: RFPercentage(6.3),
    borderRadius: RFPercentage(5),
    alignItems: 'center',
    justifyContent: 'center',
    width: RFPercentage(35),
    borderWidth: 1.4,
    borderColor: Colors.gradient2,
    backgroundColor: 'rgba(249, 252, 255, 1)',
  },
  nextButtonText: {
    fontSize: Platform.OS === 'ios' ? RFPercentage(1.7) : RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
});
