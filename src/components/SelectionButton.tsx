import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {Fonts, Colors, Icons} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

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
      disabled={props.disabled}>
      <View
        style={{
          position: 'absolute',
          zIndex: 999999,
          left: RFPercentage(0.6),
          top: RFPercentage(-1.2),
        }}>
        <Image
          source={props.icon}
          resizeMode="contain"
          style={{width: RFPercentage(2.5), height: RFPercentage(2.5)}}
        />
      </View>
      <View style={[styles.nextButton, {...props.style}]}>
        <Text style={[styles.nextButtonText]}>
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
  nextButton: {
    height: RFPercentage(5.8),
    borderRadius: RFPercentage(5),
    alignItems: 'center',
    justifyContent: 'center',
    width: RFPercentage(35),
    borderWidth: 1.4,
    borderColor: Colors.gradient2,
    backgroundColor: 'rgba(249, 252, 255, 1)',
  },
  nextButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
});
