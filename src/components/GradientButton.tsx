import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  title: string;
  style?: object;
  loading?: boolean;
  textStyle?: object;
}

const GradientButton: React.FC<Props> = (props: Props) => {
  return (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      style={[styles.nextButton, {...props.style}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={props.onPress}
        disabled={props.disabled}>
        {props.loading ? (
          <ActivityIndicator size="small" color={Colors.background} />
        ) : (
          <Text style={[styles.nextButtonText, {...props.textStyle}]}>
            {props.title}
          </Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default GradientButton;

const styles = StyleSheet.create({
  nextButton: {
    height: RFPercentage(5.6),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    width: RFPercentage(18),
  },
  nextButtonText: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.background,
    textAlign:"center"
  },
});
