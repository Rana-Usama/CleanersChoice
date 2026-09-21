import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import DatePicker from 'react-native-date-picker';
import GradientButton from './GradientButton';

interface Props {
  visible: boolean;
  invoiceId?: string;
  amount?: string;
  toName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (opts: {paidAt: Date; method: string}) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.72, RFPercentage(70));

const METHODS = ['Cash', 'Card', 'Bank Transfer', 'Other'];

const MarkAsPaidSheet: React.FC<Props> = ({
  visible,
  invoiceId,
  amount,
  toName,
  loading,
  onClose,
  onConfirm,
}) => {
  const [paidAt, setPaidAt] = useState<Date>(new Date());
  const [method, setMethod] = useState<string>('');
  const [customMethod, setCustomMethod] = useState<string>('');
  const [showDate, setShowDate] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setPaidAt(new Date());
      setMethod('');
      setCustomMethod('');
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const resolvedMethod = method === 'Other' ? customMethod.trim() : method;

  const handleConfirm = () => {
    if (loading) return;
    onConfirm({paidAt, method: resolvedMethod});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, {transform: [{translateY}]}]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={{flex: 1}}>
              <Text style={styles.title}>Mark as Paid</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {invoiceId ? `${invoiceId}` : 'Confirm payment details'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              disabled={loading}
              style={styles.closeBtn}>
              <Feather
                name="x"
                size={RFPercentage(2.4)}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          {(amount || toName) && (
            <View style={styles.summary}>
              {toName ? (
                <View style={styles.summaryRow}>
                  <Feather
                    name="user"
                    size={RFPercentage(1.6)}
                    color={Colors.secondaryText}
                  />
                  <Text style={styles.summaryText} numberOfLines={1}>
                    {toName}
                  </Text>
                </View>
              ) : null}
              {amount ? (
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons
                    name="currency-usd"
                    size={RFPercentage(1.8)}
                    color={Colors.gradient1}
                  />
                  <Text style={styles.summaryAmount}>{amount}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Payment date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Payment date</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDate(true)}
              style={styles.dateRow}>
              <Feather
                name="calendar"
                size={RFPercentage(2)}
                color={Colors.gradient1}
              />
              <Text style={styles.dateText}>
                {moment(paidAt).format('MMM DD, YYYY')}
              </Text>
              <Feather
                name="chevron-down"
                size={RFPercentage(2)}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* Method */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Payment method (optional)</Text>
            <View style={styles.chips}>
              {METHODS.map(m => {
                const active = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    activeOpacity={0.85}
                    onPress={() => setMethod(active ? '' : m)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {method === 'Other' && (
              <View style={styles.customMethodWrap}>
                <TextInput
                  style={styles.customMethodInput}
                  placeholder="Enter payment method"
                  placeholderTextColor={Colors.placeholderColor}
                  value={customMethod}
                  onChangeText={setCustomMethod}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}
          </View>

          {/* Confirm */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}
              disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <GradientButton
              title="Confirm Payment"
              onPress={handleConfirm}
              loading={loading}
              disabled={loading}
              style={styles.confirmBtn}
              textStyle={styles.confirmText}
            />
          </View>

          <DatePicker
            modal
            open={showDate}
            date={paidAt}
            mode="date"
            maximumDate={new Date()}
            onConfirm={date => {
              setShowDate(false);
              setPaidAt(date);
            }}
            onCancel={() => setShowDate(false)}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MarkAsPaidSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blackOverlay50,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(2.2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(1.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.5),
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.5),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.2),
    gap: RFPercentage(1),
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    backgroundColor: Colors.primaryBlueOverlay05,
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    borderRadius: RFPercentage(1.4),
    padding: RFPercentage(1.4),
    marginBottom: RFPercentage(2),
    gap: RFPercentage(0.6),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
  },
  summaryText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryText,
  },
  summaryAmount: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.9),
    color: Colors.gradient1,
  },
  fieldGroup: {
    marginBottom: RFPercentage(2),
  },
  fieldLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.7),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
    height: RFPercentage(5.5),
    gap: RFPercentage(0.8),
  },
  dateText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RFPercentage(0.8),
  },
  chip: {
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.9),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primaryBlueOverlay10,
    borderColor: Colors.gradient1,
  },
  chipText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
  },
  chipTextActive: {
    color: Colors.gradient1,
  },
  customMethodWrap: {
    marginTop: RFPercentage(1),
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
  },
  customMethodInput: {
    height: RFPercentage(5.5),
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.inputTextColor,
    paddingVertical: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: RFPercentage(1.2),
    marginTop: RFPercentage(0.5),
  },
  cancelBtn: {
    flex: 1.2,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1.5,
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  confirmBtn: {
    flex: 2.4,
    width: undefined,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
  },
  confirmText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
});
