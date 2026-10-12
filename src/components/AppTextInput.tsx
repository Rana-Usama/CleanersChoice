import React, {forwardRef} from 'react';
import {TextInput, TextInputProps} from 'react-native';
import {Fonts, FontScaling} from '../constants/Themes';

/**
 * Drop-in replacement for <TextInput> with accessibility-safe font scaling.
 * Caps OS font scaling at FontScaling.maxMultiplier; an explicit
 * maxFontSizeMultiplier prop at the call site still overrides the cap.
 * Ref is forwarded to the underlying TextInput (focus/blur/clear all work).
 */
const AppTextInput = forwardRef<TextInput, TextInputProps>(({style, ...props}, ref) => {
  return (
    <TextInput
      ref={ref}
      maxFontSizeMultiplier={FontScaling.maxMultiplier}
      style={[{fontFamily: Fonts.fontRegular}, style]}
      {...props}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';

export default AppTextInput;
