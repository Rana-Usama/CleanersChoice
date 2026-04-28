import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import {Invoice} from '../types/invoice';

interface Props {
  invoice: Invoice;
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
}

const InvoiceCard: React.FC<Props> = ({invoice, onView, onShare, onDownload}) => {
  return (
    <View style={styles.shadowContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={RFPercentage(2.4)}
                color={Colors.gradient1}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.invoiceId} numberOfLines={1}>
                {invoice.invoiceId}
              </Text>
              <Text style={styles.dateText}>
                {invoice.createdAt
                  ? moment(
                      invoice.createdAt?.toDate?.()
                        ? invoice.createdAt.toDate()
                        : invoice.createdAt,
                    ).format('MMM DD, YYYY')
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="account-outline"
              size={RFPercentage(1.8)}
              color={Colors.placeholderColor}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {invoice.toName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={RFPercentage(1.8)}
              color={Colors.placeholderColor}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {invoice.jobPostName}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceSection}>
            <Text style={styles.budgetLabel}>Total</Text>
            <Text style={styles.priceText}>{invoice.price?.startsWith('$') ? invoice.price : `$${invoice.price}`}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onView}
              style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={RFPercentage(2)}
                color={Colors.gradient1}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDownload}
              style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="download-outline"
                size={RFPercentage(2)}
                color={Colors.success}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onShare}
              style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={RFPercentage(2)}
                color={Colors.amber500}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default InvoiceCard;

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
    overflow: 'hidden',
    padding: RFPercentage(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: RFPercentage(1),
  },
  iconContainer: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1.2),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.2),
  },
  invoiceId: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  dateText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  detailsSection: {
    backgroundColor: Colors.gray50Overlay90,
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.6),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
  },
  detailText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    paddingTop: RFPercentage(1.5),
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: RFPercentage(0.5),
  },
  budgetLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
  },
  priceText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2),
    color: Colors.gradient1,
  },
  actions: {
    flexDirection: 'row',
    gap: RFPercentage(0.8),
  },
  actionBtn: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay50,
  },
});
