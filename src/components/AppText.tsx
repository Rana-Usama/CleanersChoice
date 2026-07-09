import React from 'react';
import {Text, TextProps} from 'react-native';
import {FontScaling, Typography, TypographyVariant} from '../constants/Themes';

interface AppTextProps extends TextProps {
  /** Optional typography preset from Themes.Typography (fontSize + lineHeight). */
  variant?: TypographyVariant;
}

/**
 * Drop-in replacement for <Text> with accessibility-safe font scaling.
 * Caps OS font scaling at FontScaling.maxMultiplier and optionally applies a
 * typography preset. Any style passed via `style` overrides the preset, and an
 * explicit maxFontSizeMultiplier prop overrides the cap.
 *
 * Usage:
 *   <AppText variant="base" style={styles.label}>Hello</AppText>
 */
const AppText: React.FC<AppTextProps> = ({variant, style, children, ...rest}) => {
  return (
    <Text
      maxFontSizeMultiplier={FontScaling.maxMultiplier}
      style={[variant ? Typography[variant] : undefined, style]}
      {...rest}>
      {children}
    </Text>
  );
};

export default AppText;
