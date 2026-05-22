import React, {useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable} from 'react-native-gesture-handler';
import moment from 'moment';
import {Invoice} from '../types/invoice';
import {getPaymentStatus} from '../services/invoiceService';
import {canRevertToUnpaid} from '../services/paymentService';
import StatusPill from './StatusPill';

interface Props {
  invoice: Invoice;
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
  onMarkPaid?: () => void;
  onRevert?: () => void;
  onDelete?: () => void;
}

const InvoiceCard: React.FC<Props> = ({
  invoice,
  onView,
  onShare,
  onDownload,
  onMarkPaid,
  onRevert,
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getPaymentStatus(invoice);
  const isUnpaid = status === 'unpaid';
  const canRevert = !isUnpaid && canRevertToUnpaid(invoice);

  const close = () => {
    setMenuOpen(false);
    swipeableRef.current?.close();
  };

  const runMenuAction = (action?: () => void) => {
    close();
    action?.();
  };

  const renderSwipeActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const showPaymentAction = isUnpaid ? !!onMarkPaid : canRevert && !!onRevert;
    if (!showPaymentAction && !onDelete) return null;

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [160, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[styles.swipeActionWrap, {transform: [{translateX}]}]}>
        {showPaymentAction ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              close();
              if (isUnpaid) onMarkPaid?.();
              else onRevert?.();
            }}
            style={[
              styles.swipeAction,
              {backgroundColor: isUnpaid ? Colors.green500 : Colors.amber500},
            ]}>
            <MaterialCommunityIcons
              name={isUnpaid ? 'check-circle' : 'undo-variant'}
              size={RFPercentage(2.5)}
              color={Colors.white}
            />
            <Text style={styles.swipeActionText}>
              {isUnpaid ? 'Mark Paid' : 'Revert'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              close();
              onDelete();
            }}
            style={[styles.swipeAction, styles.swipeDeleteAction]}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={RFPercentage(2.5)}
              color={Colors.white}
            />
            <Text style={styles.swipeActionText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View style={styles.shadowContainer}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderSwipeActions}
        overshootRight={false}
        friction={2}
        rightThreshold={40}>
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
            <StatusPill status={status} />
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
            {!isUnpaid && invoice.paymentMethod ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={RFPercentage(1.8)}
                  color={Colors.green500}
                />
                <Text style={styles.detailText} numberOfLines={1}>
                  Paid via {invoice.paymentMethod}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.priceSection}>
              <Text style={styles.budgetLabel}>Total</Text>
              <Text style={styles.priceText}>
                {invoice.price?.startsWith('$')
                  ? invoice.price
                  : `$${invoice.price}`}
              </Text>
            </View>

            <View style={styles.actions}>
              {/* <TouchableOpacity
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
              </TouchableOpacity> */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setMenuOpen(prev => !prev)}
                style={styles.actionBtn}>
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={RFPercentage(2.1)}
                  color={Colors.secondaryText}
                />
              </TouchableOpacity>
            </View>
          </View>

          {menuOpen && (
            <View style={styles.menu}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => runMenuAction(onView)}
                style={styles.menuItem}>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={RFPercentage(1.9)}
                  color={Colors.gradient1}
                />
                <Text style={styles.menuText}>View invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => runMenuAction(onShare)}
                style={styles.menuItem}>
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={RFPercentage(1.9)}
                  color={Colors.gradient1}
                />
                <Text style={styles.menuText}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => runMenuAction(onDownload)}
                style={styles.menuItem}>
                <MaterialCommunityIcons
                  name="download-outline"
                  size={RFPercentage(1.9)}
                  color={Colors.gradient1}
                />
                <Text style={styles.menuText}>Download PDF</Text>
              </TouchableOpacity>
              {isUnpaid && onMarkPaid ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => runMenuAction(onMarkPaid)}
                  style={styles.menuItem}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={RFPercentage(1.9)}
                    color={Colors.green500}
                  />
                  <Text style={[styles.menuText, styles.menuTextSuccess]}>
                    Mark as Paid
                  </Text>
                </TouchableOpacity>
              ) : null}
              {!isUnpaid && onRevert ? (
                <TouchableOpacity
                  activeOpacity={canRevert ? 0.75 : 1}
                  onPress={
                    canRevert ? () => runMenuAction(onRevert) : undefined
                  }
                  style={[
                    styles.menuItem,
                    !canRevert && styles.menuItemDisabled,
                  ]}>
                  <MaterialCommunityIcons
                    name="undo-variant"
                    size={RFPercentage(1.9)}
                    color={canRevert ? Colors.amber500 : Colors.gray400}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      canRevert
                        ? styles.menuTextWarning
                        : styles.menuTextDisabled,
                    ]}>
                    {canRevert
                      ? 'Revert to Unpaid'
                      : 'Revert locked after 30 days'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {onDelete ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => runMenuAction(onDelete)}
                  style={styles.menuItem}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={RFPercentage(1.9)}
                    color={Colors.red500}
                  />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Mark as Paid CTA — Unpaid only */}
          {isUnpaid && onMarkPaid && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onMarkPaid}
              style={styles.markPaidBtn}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={RFPercentage(2)}
                color={Colors.white}
              />
              <Text style={styles.markPaidText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}

          {/* Revert action — Paid + within window */}
          {!isUnpaid && onRevert && (
            <TouchableOpacity
              activeOpacity={canRevert ? 0.85 : 1}
              onPress={canRevert ? onRevert : undefined}
              style={[
                styles.revertBtn,
                !canRevert && styles.revertBtnDisabled,
              ]}>
              <MaterialCommunityIcons
                name="undo-variant"
                size={RFPercentage(1.8)}
                color={canRevert ? Colors.amber500 : Colors.gray400}
              />
              <Text
                style={[
                  styles.revertText,
                  !canRevert && styles.revertTextDisabled,
                ]}>
                {canRevert
                  ? 'Revert to Unpaid'
                  : 'Revert window expired (30 days)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
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
    gap: RFPercentage(1),
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
  menu: {
    marginTop: RFPercentage(1.2),
    marginBottom: RFPercentage(0.2),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(1.1),
    gap: RFPercentage(0.8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay50,
  },
  menuItemDisabled: {
    backgroundColor: Colors.gray50,
  },
  menuText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.45),
    color: Colors.primaryText,
  },
  menuTextSuccess: {
    color: Colors.green800,
  },
  menuTextWarning: {
    color: Colors.amberDarkText,
  },
  menuTextDisabled: {
    color: Colors.gray400,
  },
  markPaidBtn: {
    marginTop: RFPercentage(1.4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: RFPercentage(5),
    borderRadius: RFPercentage(1.2),
    backgroundColor: Colors.green500,
    gap: RFPercentage(0.6),
  },
  markPaidText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.white,
  },
  revertBtn: {
    marginTop: RFPercentage(1.2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberBg50,
    gap: RFPercentage(0.5),
  },
  revertBtnDisabled: {
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
  },
  revertText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.amberDarkText,
  },
  revertTextDisabled: {
    color: Colors.gray400,
  },
  swipeActionWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
    marginLeft: RFPercentage(1),
  },
  swipeAction: {
    width: RFPercentage(8),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(1),
    gap: RFPercentage(0.3),
  },
  swipeDeleteAction: {
    backgroundColor: Colors.red500,
    marginLeft: RFPercentage(0.7),
  },
  swipeActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
    color: Colors.white,
  },
  menuTextDanger: {
    color: Colors.red500,
  },
});
