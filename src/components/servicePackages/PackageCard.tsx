import React, {memo} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from 'react-native-vector-icons/Feather';
import {Colors, Fonts} from '../../constants/Themes';

interface Props {
  index: number;
  details: string;
  price: string | number;
  disabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/** Read-only view of one service package on the ServiceThree screen. */
const PackageCard: React.FC<Props> = ({
  index,
  details,
  price,
  disabled,
  onEdit,
  onRemove,
}) => (
  <View style={styles.card}>
    {/* <View style={styles.accent} /> */}
    <View style={styles.body}>
      <View style={styles.topRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>PACKAGE {index + 1}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Starting at</Text>
          <Text style={styles.price} numberOfLines={1}>
            ${price}
          </Text>
        </View>
      </View>

      <Text style={styles.details} numberOfLines={4}>
        {details}
      </Text>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Edit package ${index + 1}`}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onEdit}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          style={[styles.action, disabled && styles.actionDisabled]}>
          <Feather name="edit-2" size={15} color={Colors.gradient1} />
          <Text style={[styles.actionText, {color: Colors.gradient1}]}>
            Edit
          </Text>
        </TouchableOpacity>
        <View style={styles.actionSeparator} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remove package ${index + 1}`}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onRemove}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          style={[styles.action, disabled && styles.actionDisabled]}>
          <Feather name="trash-2" size={15} color={Colors.red500} />
          <Text style={[styles.actionText, {color: Colors.red500}]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default memo(PackageCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.slate900,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
    }),
  },
  accent: {
    width: 4,
    backgroundColor: Colors.gradient1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chip: {
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  chipText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.25),
    letterSpacing: 0.6,
    color: Colors.gradient1,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  priceLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.25),
    color: Colors.slate500,
  },
  price: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.6),
    color: Colors.slate900,
  },
  details: {
    marginTop: 10,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.65),
    lineHeight: RFPercentage(2.45),
    color: Colors.slateText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginTop: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionSeparator: {
    width: 1,
    height: 18,
    backgroundColor: Colors.slate100,
  },
  actionText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
  },
});
