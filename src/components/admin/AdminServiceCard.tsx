import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ServicesCard from '../ServicesCard';
import SubscriptionStatusPill from './SubscriptionStatusPill';
import {Colors, Fonts, IMAGES} from '../../constants/Themes';
import {AdminCleanerService} from '../../types/admin';
import {formatServiceTypes} from '../../constants/adminModules';
import {formatCityState} from '../../utils/locationFormat';

interface Props {
  service: AdminCleanerService;
  onPress: () => void;
}

const DetailRow: React.FC<{icon: string; label: string; value: string}> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.detailRow}>
    <MaterialCommunityIcons
      name={icon as any}
      size={RFPercentage(1.7)}
      color={Colors.placeholderColor}
    />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const AdminServiceCard: React.FC<Props> = ({service, onPress}) => {
  const packages = Array.isArray(service.packages) ? service.packages : [];
  const availability = Array.isArray(service.availability)
    ? service.availability
    : [];
  const covers = Array.isArray(service.serviceImages) ? service.serviceImages : [];

  const startingPrice =
    typeof packages[0]?.price === 'number' ? packages[0].price : null;

  const availableDays = availability.filter((slot: any) => slot?.checked).length;

  // A pending cancellation is only useful with the date attached — "Cancelling"
  // alone doesn't tell the client whether they have a month to win them back or
  // two days.
  const cancelsOn =
    service.badge === 'cancelling' &&
    typeof service.subscriptionEndDate === 'number'
      ? moment(service.subscriptionEndDate).format('DD MMM')
      : null;

  return (
    <View style={styles.wrapper}>
      <ServicesCard
        covers={covers}
        icon={service.image}
        name={service.name || 'Unnamed cleaner'}
        subtitle={formatServiceTypes(service.type)}
        price={startingPrice}
        star={IMAGES?.star}
        location={service.location}
        locationText={formatCityState(service.location)}
        createdAt={service.createdAt}
        onPress={onPress}
        footer={
          <View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Subscription</Text>
              <SubscriptionStatusPill
                badge={service.badge}
                label={cancelsOn ? `Cancels ${cancelsOn}` : undefined}
              />
            </View>

            {/* Service details */}
            <View style={styles.detailsBlock}>
              <DetailRow
                icon="tag-outline"
                label="Categories"
                value={String(service.type?.length ?? 0)}
              />
              <DetailRow
                icon="package-variant-closed"
                label="Packages"
                value={
                  packages.length > 0
                    ? `${packages.length}`
                    : 'None (custom pricing)'
                }
              />
              <DetailRow
                icon="calendar-check-outline"
                label="Availability"
                value={
                  availableDays > 0
                    ? `${availableDays} day${availableDays === 1 ? '' : 's'}/week`
                    : 'Not set'
                }
              />
            
            </View>

            {!!service.description && (
              <Text style={styles.description} numberOfLines={2}>
                {service.description}
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
};

export default memo(AdminServiceCard);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: RFPercentage(2),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(1),
  },
  statusLabel: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  detailsBlock: {
    backgroundColor: Colors.gray50,
    borderRadius: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay60,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(0.35),
    gap: RFPercentage(0.6),
  },
  detailLabel: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    flex: 1,
  },
  detailValue: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    maxWidth: '55%',
    textAlign: 'right',
  },
  description: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.45),
    lineHeight: RFPercentage(2),
    marginTop: RFPercentage(1),
  },
});
