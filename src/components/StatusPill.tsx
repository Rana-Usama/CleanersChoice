import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {PaymentStatus} from '../types/invoice';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

const StatusPill: React.FC<Props> = ({status, size = 'sm'}) => {
  const isPaid = status === 'paid';
  const palette = isPaid
    ? {
        bg: Colors.greenBg100,
        border: Colors.greenBorder,
        text: Colors.green800,
        icon: Colors.green500,
        label: 'Paid',
        iconName: 'check-circle' as const,
      }
    : {
        bg: Colors.amberBg50,
        border: Colors.amberBorder,
        text: Colors.amberDarkText,
        icon: Colors.amber500,
        label: 'Unpaid',
        iconName: 'clock-outline' as const,
      };

  const dims =
    size === 'md'
      ? {
          paddingH: RFPercentage(1.4),
          paddingV: RFPercentage(0.7),
          font: RFPercentage(1.5),
          icon: RFPercentage(1.8),
          gap: RFPercentage(0.5),
        }
      : {
          paddingH: RFPercentage(1.1),
          paddingV: RFPercentage(0.45),
          font: RFPercentage(1.25),
          icon: RFPercentage(1.5),
          gap: RFPercentage(0.4),
        };

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: dims.paddingH,
          paddingVertical: dims.paddingV,
          gap: dims.gap,
        },
      ]}>
      <MaterialCommunityIcons
        name={palette.iconName}
        size={dims.icon}
        color={palette.icon}
      />
      <Text
        style={[
          styles.text,
          {fontSize: dims.font, color: palette.text},
        ]}>
        {palette.label}
      </Text>
    </View>
  );
};

export default memo(StatusPill);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RFPercentage(100),
    borderWidth: 1,
  },
  text: {
    fontFamily: Fonts.semiBold,
  },
});
