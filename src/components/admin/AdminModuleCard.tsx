import React, {memo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';

/**
 * A row in the admin hub. Intentionally the same shape as the Dashboard's
 * existing `earningsCard` / `introCard` rows (icon bubble, title, subtitle,
 * chevron) so the admin section looks native to the app rather than bolted on.
 */

interface Props {
  title: string;
  subtitle: string;
  icon: string;
  count?: number | null;
  disabled?: boolean;
  onPress: () => void;
}

const AdminModuleCard: React.FC<Props> = ({
  title,
  subtitle,
  icon,
  count,
  disabled = false,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={disabled}
    onPress={onPress}
    style={[styles.card, disabled && styles.cardDisabled]}>
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons
        name={icon as any}
        size={RFPercentage(2.7)}
        color={Colors.gradient1}
      />
    </View>

    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>

    {typeof count === 'number' && (
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    )}

    <MaterialCommunityIcons
      name="chevron-right"
      size={RFPercentage(2.4)}
      color={Colors.secondaryText}
    />
  </TouchableOpacity>
);

export default memo(AdminModuleCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    paddingVertical: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay60,
    shadowColor: Colors.shadowBlueLight,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: RFPercentage(5.2),
    height: RFPercentage(5.2),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.blueBg50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.5),
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
  },
  subtitle: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.45),
    marginTop: RFPercentage(0.3),
  },
  countBadge: {
    minWidth: RFPercentage(3.2),
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.blueBg100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(0.8),
  },
  countText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
  },
});
