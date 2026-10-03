import React, {memo} from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Colors, Fonts} from '../constants/Themes';

/**
 * Unread-count badge for the header bell (cleaner Dashboard + customer Home).
 *
 * Why this exists: the old inline badge shrink-wrapped its text. It is
 * absolutely positioned inside the 8px-padded bell button, so Yoga measured the
 * text against that button's narrow content box (~22px) — too narrow for "9+"
 * in Poppins plus padding — and the "+" wrapped onto a second line that the
 * fixed 18px height clipped, leaving a stray stroke beside the 9.
 *
 * Fix: the badge gets an EXPLICIT width from the label length, so nothing
 * depends on the parent's measured width, and the text is single-line,
 * unscaled (it's a fixed-size chip) and free of Android font padding.
 */

interface Props {
  count: number;
  /** Counts above this render as "<max>+". */
  max?: number;
  style?: StyleProp<ViewStyle>;
}

const SIZE = 18;
const PILL_WIDTH = 24; // fits "9+"

const NotificationBadge: React.FC<Props> = ({count, max = 9, style}) => {
  if (!count || count <= 0) {
    return null;
  }
  const label = count > max ? `${max}+` : String(count);
  const width = label.length > 1 ? PILL_WIDTH : SIZE;

  return (
    <View
      style={[styles.badge, {width}, style]}
      pointerEvents="none"
      accessibilityLabel={`${count} unread notification${count === 1 ? '' : 's'}`}>
      <Text
        style={styles.text}
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {label}
      </Text>
    </View>
  );
};

export default memo(NotificationBadge);

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.red500,
    alignItems: 'center',
    justifyContent: 'center',
    // Separates the badge from the translucent bell button behind it.
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  text: {
    color: Colors.white,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
