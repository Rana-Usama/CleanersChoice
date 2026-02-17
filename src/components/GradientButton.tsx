import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
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
      style={[styles.nextButton, props.style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={props.onPress}
        disabled={props.disabled || props.loading}
        style={styles.touchableArea}>
        {props.loading ? (
          <ActivityIndicator 
            size="small" 
            color={Colors.background} 
            animating={true}
          />
        ) : (
          <Text style={[styles.nextButtonText, props.textStyle]}>
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
    width: RFPercentage(20),
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.background,
    textAlign: 'center',
  },
});