import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '../../constants/Themes';
import {SubscriptionBadgeKey} from '../../types/admin';
import {getSubscriptionBadge} from '../../utils/subscriptionStatus';

/**
 * Subscription state badge: Active / Overdue / Expired.
 *
 * Visually identical to the existing StatusPill (components/StatusPill.tsx) so
 * the admin screens read as part of the same design system. A separate component
 * because StatusPill is typed to the invoice `PaymentStatus` union (paid/unpaid)
 * and hardcodes those two palettes — widening it would have meant changing a
 * component the invoice screens depend on.
 */

interface Props {
  badge: SubscriptionBadgeKey;
  size?: 'sm' | 'md';
  /**
   * Overrides the badge's default text, keeping its colours and icon. Used for
   * the pending cancellation, which shows the actual date ("Cancels 12 Sep")
   * rather than a bare "Cancelling".
   */
  label?: string;
}

const SubscriptionStatusPill: React.FC<Props> = ({
  badge,
  size = 'sm',
  label,
}) => {
  const palette = getSubscriptionBadge(badge);

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
        name={palette.iconName as any}
        size={dims.icon}
        color={palette.icon}
      />
      <Text style={[styles.text, {fontSize: dims.font, color: palette.text}]}>
        {label || palette.label}
      </Text>
    </View>
  );
};

export default memo(SubscriptionStatusPill);

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
