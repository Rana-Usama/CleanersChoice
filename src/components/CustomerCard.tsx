import React, {memo} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import {Customer} from '../types/customer';
import {getAvatarInitials} from '../utils/avatarInitials';

interface Props {
  customer: Customer;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CustomerCard: React.FC<Props> = ({customer, onPress, onEdit, onDelete}) => {
  const initials = getAvatarInitials(customer.name);
  const isAuto = customer.source === 'auto';

  return (
    <View style={styles.shadowContainer}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.container}>
        <View style={styles.row}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>

          {/* Identity */}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {customer.name || 'Unnamed'}
              </Text>
              {isAuto && (
                <View style={styles.autoBadge}>
                  <Text style={styles.autoBadgeText}>Auto</Text>
                </View>
              )}
            </View>

            {customer.phone ? (
              <View style={styles.metaRow}>
                <Feather
                  name="phone"
                  size={RFPercentage(1.5)}
                  color={Colors.placeholderColor}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.phone}
                </Text>
              </View>
            ) : null}

            {customer.email ? (
              <View style={styles.metaRow}>
                <Feather
                  name="mail"
                  size={RFPercentage(1.5)}
                  color={Colors.placeholderColor}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.email}
                </Text>
              </View>
            ) : null}

            {customer.invoiceCount > 0 ? (
              <View style={styles.statsRow}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={RFPercentage(1.5)}
                  color={Colors.gradient1}
                />
                <Text style={styles.statsText}>
                  {customer.invoiceCount} invoice
                  {customer.invoiceCount !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEdit}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              style={styles.actionBtn}>
              <Feather
                name="edit-2"
                size={RFPercentage(1.7)}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDelete}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              style={styles.actionBtn}>
              <Feather
                name="trash-2"
                size={RFPercentage(1.7)}
                color={Colors.red500}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default memo(CustomerCard);

const styles = StyleSheet.create({
  shadowContainer: {
    width: '100%',
    alignSelf: 'center',
    shadowColor: Colors.shadowBlueGrayLight,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(2),
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    borderRadius: RFPercentage(2),
    backgroundColor: Colors.white,
    padding: RFPercentage(1.8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.5),
  },
  avatarText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2),
    color: Colors.gradient1,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(0.3),
  },
  name: {
    flexShrink: 1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
  autoBadge: {
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.2),
    borderRadius: RFPercentage(0.6),
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  autoBadgeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.1),
    color: Colors.gradient1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
    marginTop: RFPercentage(0.3),
  },
  metaText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
    marginTop: RFPercentage(0.5),
  },
  statsText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.gradient1,
  },
  actions: {
    flexDirection: 'row',
    gap: RFPercentage(0.8),
    marginLeft: RFPercentage(1),
  },
  actionBtn: {
    width: RFPercentage(3.8),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay50,
  },
});
