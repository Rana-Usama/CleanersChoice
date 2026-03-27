import React, {useState, useEffect} from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {showToast} from '../../../../utils/ToastMessage';
import GradientButton from '../../../../components/GradientButton';
import {InvoiceFormData, InvoiceValidationErrors} from '../../../../types/invoice';
import {
  createInvoiceDraftFromJob,
  validateInvoiceForm,
  checkExistingInvoiceForJob,
} from '../../../../services/invoiceService';

const InvoiceForm = ({route, navigation}: any) => {
  const {item} = route.params;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<InvoiceFormData>({
    invoiceId: '',
    dueDate: new Date(),
    jobPostName: '',
    description: '',
    price: '',
    fromName: '',
    fromEmail: '',
    cleanerCompanyName: '',
    toName: '',
    toEmail: '',
  });
  const [errors, setErrors] = useState<InvoiceValidationErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const handlePreview = () => {
    const validationErrors = validateInvoiceForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }
    navigation.navigate('InvoicePreview', {formData: form, jobItem: item});
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('dueDate', selectedDate);
    }
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
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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

          {/* Due Date */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>Due Date</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.inputContainer}>
              <Text style={styles.inputText}>
                {moment(form.dueDate).format('MMM DD, YYYY')}
              </Text>
              <Feather name="calendar" size={18} color={Colors.secondaryText} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* From Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-arrow-right"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.sectionTitle}>From (You)</Text>
            </View>
            <FormField
              label="Company Name"
              value={form.cleanerCompanyName}
              onChangeText={v => updateField('cleanerCompanyName', v)}
              error={errors.cleanerCompanyName}
              placeholder="Your company name"
            />
            <FormField
              label="Full Name"
              value={form.fromName}
              onChangeText={v => updateField('fromName', v)}
              error={errors.fromName}
              placeholder="Your full name"
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
              <Text style={styles.sectionTitle}>Bill To (Customer)</Text>
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
            <FormField
              label="Price ($)"
              value={form.price}
              onChangeText={v => updateField('price', v)}
              error={errors.price}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={{height: RFPercentage(2)}} />
        </ScrollView>
      </KeyboardAvoidingView>

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
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[
        styles.textInput,
        error && styles.inputError,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 16,
    marginBottom: RFPercentage(2),
    padding: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderBottomWidth: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.5),
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
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
  textInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
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
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
});
