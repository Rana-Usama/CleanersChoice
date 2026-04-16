import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../../utils/ToastMessage';
import GradientButton from '../../../../components/GradientButton';
import InputField from '../../../../components/InputField';
import DollarIcon from '../../../../assets/svg/DollarIcon';
import SquareFeetIcon from '../../../../assets/svg/SquareFeetIcon';
import {InvoiceFormData, InvoiceValidationErrors} from '../../../../types/invoice';
import {
  createInvoiceDraftFromJob,
  validateInvoiceForm,
  checkExistingInvoiceForJob,
} from '../../../../services/invoiceService';
import {useSoftInputAdjustNothing} from '../../../../hooks/useSoftInputMode';

const InvoiceForm = ({route, navigation}: any) => {
  const {item} = route.params;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<InvoiceFormData>({
    invoiceId: '',
    dueDate: new Date(),
    jobPostName: '',
    description: '',
    price: '',
    budgetType: 'flat',
    hourlyRate: '',
    hours: '',
    pricePerSqFt: '',
    sqFt: '',
    fromName: '',
    fromEmail: '',
    cleanerCompanyName: '',
    toName: '',
    toEmail: '',
  });
  const [errors, setErrors] = useState<InvoiceValidationErrors>({});
  const [budgetErrors, setBudgetErrors] = useState<{price?: boolean; hourlyRate?: boolean; hours?: boolean; pricePerSqFt?: boolean; sqFt?: boolean}>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useSoftInputAdjustNothing();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      // Check if invoice already exists for this job
      const existingInvoice = await checkExistingInvoiceForJob(item.id);
      if (existingInvoice) {
        showToast({
          type: 'error',
          title: 'Invoice Exists',
          message: `Invoice ${existingInvoice.invoiceId} already generated for this job`,
        });
        navigation.goBack();
        return;
      }

      // Fetch cleaner data
      const cleanerDoc = await firestore()
        .collection('Users')
        .doc(user.uid)
        .get();
      const cleanerData = cleanerDoc.data();

      // Fetch customer data
      const customerDoc = await firestore()
        .collection('Users')
        .doc(item.jobId)
        .get();
      const customerData = customerDoc.data();

      const draft = createInvoiceDraftFromJob(
        item,
        cleanerData,
        customerData,
      );
      setForm(draft);
    } catch (error) {
      console.error('Error loading invoice draft:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load invoice data',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof InvoiceFormData, value: any) => {
    setForm(prev => ({...prev, [field]: value}));
    if (errors[field as keyof InvoiceValidationErrors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleBudgetChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
    updateField('price', numeric ? `$${numeric}` : '');
    if (budgetErrors.price) setBudgetErrors(prev => ({...prev, price: undefined}));
  };

  const handleBudgetTypeChange = (type: 'flat' | 'hourly' | 'sqft') => {
    updateField('budgetType', type);
  };

  // Compute the total price based on budget type for preview
  const computePriceForPreview = (): InvoiceFormData => {
    const data = {...form};
    if (form.budgetType === 'hourly') {
      const rate = parseInt(form.hourlyRate.replace(/[^0-9]/g, ''), 10) || 0;
      const hrs = parseInt(form.hours, 10) || 0;
      data.price = `$${rate * hrs}`;
    } else if (form.budgetType === 'sqft') {
      const ppsf = parseInt(form.pricePerSqFt.replace(/[^0-9]/g, ''), 10) || 0;
      const sf = parseInt(form.sqFt, 10) || 0;
      data.price = `$${ppsf * sf}`;
    }
    return data;
  };

  const handlePreview = () => {
    // Budget-specific validation
    const newBudgetErrors: typeof budgetErrors = {};
    if (form.budgetType === 'flat' && !form.price.trim()) {
      newBudgetErrors.price = true;
    }
    if (form.budgetType === 'hourly') {
      if (!form.hourlyRate.trim()) newBudgetErrors.hourlyRate = true;
      if (!form.hours.trim()) newBudgetErrors.hours = true;
    }
    if (form.budgetType === 'sqft') {
      if (!form.pricePerSqFt.trim()) newBudgetErrors.pricePerSqFt = true;
      if (!form.sqFt.trim()) newBudgetErrors.sqFt = true;
    }
    if (Object.keys(newBudgetErrors).length > 0) {
      setBudgetErrors(newBudgetErrors);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }
    const formToValidate = computePriceForPreview();
    const validationErrors = validateInvoiceForm(formToValidate);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }
    navigation.navigate('InvoicePreview', {formData: formToValidate, jobItem: item});
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color={Colors.gradient1} />
        <Text style={styles.loadingText}>Preparing invoice...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Create Invoice</Text>
          <View style={{width: RFPercentage(5)}} />
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
          {/* Invoice ID (read-only) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="identifier"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Invoice ID</Text>
            </View>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Text style={styles.disabledText}>{form.invoiceId}</Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Date</Text>
            </View>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Text style={styles.disabledText}>
                {moment(form.dueDate).format('MMM DD, YYYY')}
              </Text>
            </View>
          </View>

          {/* From Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-arrow-right"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>From</Text>
            </View>
            <FormField
              label="Name"
              value={form.cleanerCompanyName}
              onChangeText={v => {
                updateField('cleanerCompanyName', v);
                updateField('fromName', v);
              }}
              error={errors.cleanerCompanyName}
              placeholder="Company / Business name"
            />
            <FormField
              label="Email"
              value={form.fromEmail}
              onChangeText={v => updateField('fromEmail', v)}
              error={errors.fromEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />
          </View>

          {/* To Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-arrow-left"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Bill To</Text>
            </View>
            <FormField
              label="Customer Name"
              value={form.toName}
              onChangeText={v => updateField('toName', v)}
              error={errors.toName}
              placeholder="Customer name"
            />
            <FormField
              label="Customer Email"
              value={form.toEmail}
              onChangeText={v => updateField('toEmail', v)}
              error={errors.toEmail}
              placeholder="customer@email.com"
              keyboardType="email-address"
            />
          </View>

          {/* Job Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Job Details</Text>
            </View>
            <FormField
              label="Job Post Name"
              value={form.jobPostName}
              onChangeText={v => updateField('jobPostName', v)}
              error={errors.jobPostName}
              placeholder="Job title"
            />
            <FormField
              label="Description (Optional)"
              value={form.description}
              onChangeText={v => updateField('description', v)}
              placeholder="Add any notes..."
              multiline
            />
          </View>

          {/* Budget */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <DollarIcon width={RFPercentage(2.2)} height={RFPercentage(2.2)} color={Colors.gradient1} />
              <Text style={styles.sectionTitle}>Budget</Text>
            </View>

            {/* Budget Type Tabs */}
            <View style={styles.budgetTabs}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.budgetTab,
                  styles.budgetTabFlat,
                  form.budgetType === 'flat' && styles.budgetTabActive,
                ]}
                onPress={() => handleBudgetTypeChange('flat')}>
                <View style={[
                  styles.budgetTabIconBox,
                  form.budgetType === 'flat' && styles.budgetTabIconBoxActive,
                ]}>
                  <DollarIcon
                    width={16}
                    height={16}
                    color={form.budgetType === 'flat' ? '#4D85FE' : '#9CA3AF'}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.budgetTabText,
                    form.budgetType === 'flat' && styles.budgetTabTextActive,
                  ]}>
                  Flat Rate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.budgetTab,
                  styles.budgetTabHourly,
                  form.budgetType === 'hourly' && styles.budgetTabActive,
                ]}
                onPress={() => handleBudgetTypeChange('hourly')}>
                <View style={[
                  styles.budgetTabIconBox,
                  form.budgetType === 'hourly' && styles.budgetTabIconBoxActive,
                ]}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={form.budgetType === 'hourly' ? '#4D85FE' : '#9CA3AF'}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.budgetTabText,
                    form.budgetType === 'hourly' && styles.budgetTabTextActive,
                  ]}>
                  Hourly Rate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.budgetTab,
                  styles.budgetTabSqft,
                  form.budgetType === 'sqft' && styles.budgetTabActive,
                ]}
                onPress={() => handleBudgetTypeChange('sqft')}>
                <View style={[
                  styles.budgetTabIconBox,
                  form.budgetType === 'sqft' && styles.budgetTabIconBoxActive,
                ]}>
                  <SquareFeetIcon
                    width={16}
                    height={16}
                    color={form.budgetType === 'sqft' ? '#4D85FE' : '#9CA3AF'}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.budgetTabText,
                    form.budgetType === 'sqft' && styles.budgetTabTextActive,
                  ]}>
                  Sq Footage
                </Text>
              </TouchableOpacity>
            </View>

            {/* Flat Rate Fields */}
            {form.budgetType === 'flat' && (
              <View>
                <Text style={styles.budgetFieldLabel}>Total Price</Text>
                <InputField
                  placeholder="$"
                  customStyle={[styles.budgetInput, budgetErrors.price && styles.budgetInputError]}
                  value={form.price}
                  onChangeText={handleBudgetChange}
                  type={'numeric'}
                />
              </View>
            )}

            {/* Hourly Rate Fields */}
            {form.budgetType === 'hourly' && (
              <View>
                <Text style={styles.budgetFieldLabel}>Rate per Hour</Text>
                <View style={styles.budgetRow}>
                  <InputField
                    placeholder="$"
                    customStyle={[styles.budgetInputHalf, budgetErrors.hourlyRate && styles.budgetInputError]}
                    value={form.hourlyRate}
                    onChangeText={(text: string) => {
                      const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                      updateField('hourlyRate', numeric ? `$${numeric}` : '');
                      if (budgetErrors.hourlyRate) setBudgetErrors(prev => ({...prev, hourlyRate: undefined}));
                    }}
                    type={'numeric'}
                  />
                  <View style={[styles.sqftInputWrapper, budgetErrors.hours && styles.sqftInputWrapperError]}>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={Colors.placeholderColor}
                      style={styles.sqftTextInput}
                      value={form.hours}
                      onChangeText={(text: string) => {
                        const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                        updateField('hours', numeric);
                        if (budgetErrors.hours) setBudgetErrors(prev => ({...prev, hours: undefined}));
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.sqftSuffix}>Hours</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Square Footage Fields */}
            {form.budgetType === 'sqft' && (
              <View>
                <Text style={styles.budgetFieldLabel}>Price per Sq Ft</Text>
                <View style={styles.budgetRow}>
                  <InputField
                    placeholder="$"
                    customStyle={[styles.budgetInputHalf, budgetErrors.pricePerSqFt && styles.budgetInputError]}
                    value={form.pricePerSqFt}
                    onChangeText={(text: string) => {
                      const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                      updateField('pricePerSqFt', numeric ? `$${numeric}` : '');
                      if (budgetErrors.pricePerSqFt) setBudgetErrors(prev => ({...prev, pricePerSqFt: undefined}));
                    }}
                    type={'numeric'}
                  />
                  <View style={[styles.sqftInputWrapper, budgetErrors.sqFt && styles.sqftInputWrapperError]}>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={Colors.placeholderColor}
                      style={styles.sqftTextInput}
                      value={form.sqFt}
                      onChangeText={(text: string) => {
                        const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                        updateField('sqFt', numeric);
                        if (budgetErrors.sqFt) setBudgetErrors(prev => ({...prev, sqFt: undefined}));
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.sqftSuffix}>Sq Ft</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.budgetHint}>
              Estimated cost for the service ($)
            </Text>
          </View>

          <View style={{height: RFPercentage(2)}} />
        </ScrollView>
        {/* Bottom Action */}
        <View style={styles.actionBar}>
            <GradientButton
              title="Preview Invoice"
              onPress={handlePreview}
              style={styles.previewButton}
              textStyle={styles.previewButtonText}
            />
          </View>
    </View>
  );
};

// Reusable form field component
const FormField = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  multiline,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  prefix?: string;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputRow, error && styles.inputError]}>
      {prefix ? (
        <Text style={styles.inputPrefix}>{prefix}</Text>
      ) : null}
      <TextInput
        style={[
          styles.textInput,
          prefix && {paddingLeft: 0},
          multiline && {height: RFPercentage(10), textAlignVertical: 'top'},
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholderColor}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default InvoiceForm;

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
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
    height: RFPercentage(5.5),
  },
  inputText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  disabledInput: {
    backgroundColor: Colors.lightGrayBg,
    borderColor: Colors.gray200,
  },
  disabledText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
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
  inputPrefix: {
    paddingLeft: RFPercentage(1.3),
    paddingRight: 0,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.inputTextColor,
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
  previewButton: {
    width: '100%',
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
  },
  previewButtonText: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
  },
  budgetTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: RFPercentage(1.5),
  },
  budgetTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: RFPercentage(6.5),
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
    borderWidth: 1,
    borderColor: '#9CA3AF1A',
    backgroundColor: 'transparent',
  },
  budgetTabFlat: {
    flex: 1,
  },
  budgetTabHourly: {
    flex: 1,
    marginHorizontal: RFPercentage(0.6),
  },
  budgetTabSqft: {
    flex: 1,
  },
  budgetTabActive: {
    borderColor: '#4D85FE80',
    backgroundColor: '#4D85FE1A',
  },
  budgetTabIconBox: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(0.8),
    backgroundColor: '#9CA3AF10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTabIconBoxActive: {
    backgroundColor: '#4D85FE10',
  },
  budgetTabText: {
    fontSize: RFPercentage(1.34),
    lineHeight: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#9CA3AF',
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: true,
  },
  budgetTabTextActive: {
    color: '#4D85FE',
  },
  budgetFieldLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.8),
  },
  budgetInput: {
    width: '100%',
    height: RFPercentage(5.5),
    backgroundColor: Colors.inputBg,
    borderColor: Colors.inputBorder,
  },
  budgetInputError: {
    borderColor: Colors.red500,
    borderWidth: 1,
  },
  sqftInputWrapperError: {
    borderColor: Colors.red500,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: RFPercentage(1),
  },
  budgetInputHalf: {
    flex: 1,
    height: RFPercentage(5.5),
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sqftInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: RFPercentage(5.5),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.3),
    backgroundColor: Colors.inputBg,
    paddingHorizontal: RFPercentage(1.5),
    marginVertical: RFPercentage(1),
  },
  sqftTextInput: {
    flex: 1,
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    paddingVertical: 0,
  },
  sqftSuffix: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#9CA3AF',
    marginLeft: RFPercentage(0.5),
  },
  budgetHint: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.5),
  },
});
