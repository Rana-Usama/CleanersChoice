import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../../../constants/Themes';
import GradientButton from '../../../../components/GradientButton';
import {useAppAlert} from '../../../../components/AlertProvider';
import {showToast} from '../../../../utils/ToastMessage';
import {
  buildMatchKey,
  createCustomer,
  customerToFormData,
  deleteCustomer,
  findCustomerByMatchKey,
  updateCustomer,
  validateCustomerForm,
} from '../../../../services/customerService';
import {
  Customer,
  CustomerFormData,
  CustomerValidationErrors,
} from '../../../../types/customer';

const EMPTY_FORM: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

const CustomerForm = ({route, navigation}: any) => {
  const existing: Customer | null = route.params?.customer || null;
  const isEdit = !!existing?.id;
  const {showAlert} = useAppAlert();

  const [form, setForm] = useState<CustomerFormData>(
    existing ? customerToFormData(existing) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<CustomerValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const updateField = (field: keyof CustomerFormData, value: string) => {
    setForm(prev => ({...prev, [field]: value}));
    if (errors[field as keyof CustomerValidationErrors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const validation = validateCustomerForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the highlighted fields',
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && existing?.id) {
        await updateCustomer(existing.id, form);
        showToast({
          type: 'success',
          title: 'Updated',
          message: 'Contact saved',
        });
      } else {
        // Duplicate detection — warn but allow override
        const key = buildMatchKey(form.name, form.email, form.phone);
        const duplicate = await findCustomerByMatchKey(key);
        if (duplicate) {
          setSaving(false);
          showAlert({
            title: 'Contact already exists',
            message: `${duplicate.name} is already in your Phone Book. Open the existing contact instead?`,
            variant: 'confirm',
            buttons: [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Open existing',
                onPress: () =>
                  navigation.replace('CustomerForm', {customer: duplicate}),
              },
            ],
          });
          return;
        }

        await createCustomer(form, 'manual');
        showToast({
          type: 'success',
          title: 'Added',
          message: 'Contact added to Phone Book',
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('[CustomerForm.handleSave]', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save contact',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing?.id) return;
    showAlert({
      title: 'Delete contact?',
      message: `${existing.name || 'This contact'} will be removed from your Phone Book. Existing invoices for this customer will not be affected.`,
      variant: 'destructive',
      iconName: 'trash-can-outline',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!existing.id) return;
            setDeleting(true);
            try {
              await deleteCustomer(existing.id);
              showToast({
                type: 'success',
                title: 'Deleted',
                message: 'Contact removed',
              });
              navigation.goBack();
            } catch (error) {
              console.error('[CustomerForm.handleDelete]', error);
              showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete contact',
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Contact' : 'Add Contact'}
          </Text>
          {isEdit ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.backButton}
              disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Feather name="trash-2" size={22} color={Colors.white} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{width: RFPercentage(5)}} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && {
            paddingBottom: keyboardHeight + RFPercentage(12),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        {/* Identity */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account-outline"
              size={RFPercentage(2.4)}
              color={Colors.gradient1}
            />
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>

          <FormField
            label="Name *"
            value={form.name}
            onChangeText={v => updateField('name', v)}
            error={errors.name}
            placeholder="Full name"
            autoCapitalize="words"
          />

          <FormField
            label="Email"
            value={form.email}
            onChangeText={v => updateField('email', v)}
            error={errors.email}
            placeholder="customer@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormField
            label="Phone"
            value={form.phone}
            onChangeText={v => updateField('phone', v)}
            error={errors.phone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={RFPercentage(2.4)}
              color={Colors.gradient1}
            />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>

          <FormField
            label="Street, City, State"
            value={form.address}
            onChangeText={v => updateField('address', v)}
            placeholder="Customer address"
            multiline
          />
        </View>

        {/* Notes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={RFPercentage(2.4)}
              color={Colors.gradient1}
            />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>

          <FormField
            label="Internal notes (gate code, preferences...)"
            value={form.notes}
            onChangeText={v => updateField('notes', v)}
            placeholder="Anything that helps you serve this customer better"
            multiline
          />
        </View>

        {isEdit && existing && (
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Feather
                name="file-text"
                size={RFPercentage(1.6)}
                color={Colors.secondaryText}
              />
              <Text style={styles.metaText}>
                {existing.invoiceCount || 0} invoice
                {(existing.invoiceCount || 0) !== 1 ? 's' : ''} generated
              </Text>
            </View>
            {existing.source === 'auto' && (
              <Text style={styles.metaHint}>
                This contact was imported automatically from a previous invoice.
              </Text>
            )}
          </View>
        )}

        <View style={{height: RFPercentage(2)}} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <GradientButton
          title={isEdit ? 'Save Changes' : 'Add Contact'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </View>
    </View>
  );
};

// Reusable field — kept inline so styles stay co-located with the screen.
const FormField = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputRow, error && styles.inputError]}>
      <TextInput
        style={[
          styles.textInput,
          multiline && {height: RFPercentage(8), textAlignVertical: 'top'},
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholderColor}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default CustomerForm;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(2),
  },
  backButton: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  scrollContent: {
    padding: RFPercentage(2),
    paddingBottom: RFPercentage(12),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(2),
    padding: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: RFPercentage(0.25)},
    shadowOpacity: 0.05,
    shadowRadius: RFPercentage(1),
    borderBottomWidth: RFPercentage(0.4),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.5),
  },
  sectionTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
  fieldContainer: {
    marginBottom: RFPercentage(1.5),
  },
  fieldLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.5),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.2),
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.inputTextColor,
  },
  inputError: {
    borderColor: Colors.red500,
  },
  errorText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.red500,
    marginTop: RFPercentage(0.3),
  },
  metaCard: {
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1.2),
    backgroundColor: Colors.primaryBlueOverlay05,
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    gap: RFPercentage(0.5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
  },
  metaText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
  },
  metaHint: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.secondaryText,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: RFPercentage(-0.4)},
    shadowOpacity: 0.05,
    shadowRadius: RFPercentage(0.8),
    elevation: 10,
  },
  saveButton: {
    width: '100%',
    height: RFPercentage(6),
    borderRadius: RFPercentage(100),
  },
  saveButtonText: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
  },
});
