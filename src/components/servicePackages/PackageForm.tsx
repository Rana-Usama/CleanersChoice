import React, {useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import {Colors, Fonts} from '../../constants/Themes';

export const PACKAGE_DETAILS_MAX = 250;

interface Props {
  title: string;
  details: string;
  price: string;
  errors: {details?: string; price?: string};
  submitLabel: string;
  saving?: boolean;
  autoFocus?: boolean;
  onChangeDetails: (text: string) => void;
  onChangePrice: (text: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * Add / edit form for one service package. Fully controlled — ServiceThree
 * owns the draft state and validation, so add and edit share one code path.
 */
const PackageForm: React.FC<Props> = ({
  title,
  details,
  price,
  errors,
  submitLabel,
  saving,
  autoFocus,
  onChangeDetails,
  onChangePrice,
  onCancel,
  onSubmit,
}) => {
  const [focused, setFocused] = useState<'details' | 'price' | null>(null);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="package" size={16} color={Colors.gradient1} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* What's included */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>What's included</Text>
        <Text style={styles.counter}>
          {details.length}/{PACKAGE_DETAILS_MAX}
        </Text>
      </View>
      <View
        style={[
          styles.field,
          styles.detailsField,
          focused === 'details' && styles.fieldFocused,
          !!errors.details && styles.fieldError,
        ]}>
        <TextInput
          style={styles.detailsInput}
          value={details}
          onChangeText={onChangeDetails}
          placeholder="e.g. Kitchen and 2 bathrooms, deep clean, supplies included"
          placeholderTextColor={Colors.slate400}
          maxLength={PACKAGE_DETAILS_MAX}
          multiline
          textAlignVertical="top"
          autoFocus={autoFocus}
          editable={!saving}
          onFocus={() => setFocused('details')}
          onBlur={() => setFocused(null)}
        />
      </View>
      {!!errors.details && <FieldError text={errors.details} />}

      {/* Starting price */}
      <Text style={[styles.label, styles.priceLabel]}>Starting price</Text>
      <View
        style={[
          styles.field,
          styles.priceField,
          focused === 'price' && styles.fieldFocused,
          !!errors.price && styles.fieldError,
        ]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.priceInput}
          value={price}
          onChangeText={onChangePrice}
          placeholder="0"
          placeholderTextColor={Colors.slate400}
          keyboardType="number-pad"
          maxLength={6}
          editable={!saving}
          onFocus={() => setFocused('price')}
          onBlur={() => setFocused(null)}
        />
        <Text style={styles.currencyCode}>USD</Text>
      </View>
      {!!errors.price && <FieldError text={errors.price} />}

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={onCancel}
          disabled={saving}
          style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={onSubmit}
          disabled={saving}
          style={styles.submitButton}>
          <LinearGradient
            colors={[Colors.gradient1, Colors.gradient2]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.submitGradient}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Feather name="check" size={17} color={Colors.white} />
                <Text style={styles.submitText}>{submitLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FieldError = ({text}: {text: string}) => (
  <View style={styles.errorRow}>
    <Feather name="alert-circle" size={13} color={Colors.red500} />
    <Text style={styles.errorText}>{text}</Text>
  </View>
);

export default PackageForm;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.gradient1,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.slate900,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gray700,
  },
  priceLabel: {
    marginTop: 14,
    marginBottom: 6,
  },
  counter: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.slate400,
  },
  field: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  fieldFocused: {
    borderColor: Colors.gradient1,
    backgroundColor: Colors.white,
  },
  fieldError: {
    borderColor: Colors.red500,
  },
  detailsField: {
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  detailsInput: {
    minHeight: RFPercentage(9),
    maxHeight: RFPercentage(16),
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2.4),
    color: Colors.slate900,
    padding: 0,
  },
  priceField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  currency: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.slate500,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.slate900,
    padding: 0,
  },
  currencyCode: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.slate400,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.red500,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.65),
    color: Colors.slate500,
  },
  submitButton: {
    flex: 1.6,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.65),
    color: Colors.white,
  },
});
