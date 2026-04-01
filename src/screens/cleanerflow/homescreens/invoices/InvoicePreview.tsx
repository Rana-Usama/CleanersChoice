import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import {showToast} from '../../../../utils/ToastMessage';
import GradientButton from '../../../../components/GradientButton';
import {InvoiceFormData} from '../../../../types/invoice';
import {
  generateInvoicePdf,
  shareInvoicePdf,
  saveInvoiceToFirestore,
  checkExistingInvoiceForJob,
  generateInvoiceId,
} from '../../../../services/invoiceService';

const InvoicePreview = ({route, navigation}: any) => {
  const {formData, jobItem, viewOnly}: {formData: InvoiceFormData; jobItem: any; viewOnly?: boolean} =
    route.params;
  const [generating, setGenerating] = useState(false);

  const handleGenerateAndShare = async () => {
    setGenerating(true);
    try {
      // Check if invoice already exists for this job
      const existingInvoice = await checkExistingInvoiceForJob(jobItem.id);
      if (existingInvoice) {
        showToast({
          type: 'error',
          title: 'Invoice Exists',
          message: `Invoice ${existingInvoice.invoiceId} already generated for this job`,
        });
        navigation.navigate('CleanerNavigator', {screen: 'Invoices'});
        return;
      }

      // Generate unique invoice ID at save time
      const uniqueInvoiceId = generateInvoiceId();
      const finalFormData = {...formData, invoiceId: uniqueInvoiceId};

      // Generate PDF with the final unique invoice ID
      const pdfPath = await generateInvoicePdf(finalFormData);

      // Save to Firestore
      await saveInvoiceToFirestore(
        finalFormData,
        jobItem.id,
        jobItem.jobId,
        pdfPath,
      );

      showToast({
        type: 'success',
        title: 'Invoice Created',
        message: 'Invoice saved and PDF generated',
      });

      // Share PDF
      try {
        await shareInvoicePdf(pdfPath, finalFormData.invoiceId);
      } catch (shareErr: any) {
        // User may dismiss the share sheet, which is fine
        if (
          !shareErr?.message?.includes('User did not share') &&
          !shareErr?.message?.includes('cancel')
        ) {
          console.error('Share error:', shareErr);
        }
      }

      // Navigate back to invoices
      navigation.navigate('CleanerNavigator', {screen: 'Invoices'});
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate invoice',
      });
    } finally {
      setGenerating(false);
    }
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
          <Text style={styles.headerTitle}>Invoice Preview</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Invoice Document */}
        <View style={styles.invoiceDocument}>
          {/* Company Header */}
          <View style={styles.companyHeader}>
            <MaterialCommunityIcons
              name="domain"
              size={RFPercentage(3)}
              color={Colors.gradient1}
            />
            <Text style={styles.companyName}>
              Cleaner Choice
            </Text>
            <Text style={styles.companySubtitle}>
              Professional Cleaning Services
            </Text>
          </View>

          {/* Invoice title + ID */}
          <View style={styles.invoiceTitleRow}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceIdText}>{formData.invoiceId}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Due Date */}
          <View style={styles.dueDateBar}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={RFPercentage(1.8)}
              color={Colors.amber500}
            />
            <Text style={styles.dueDateText}>
              Due Date:{' '}
              <Text style={styles.dueDateValue}>
                {moment(formData.dueDate).format('MMM DD, YYYY')}
              </Text>
            </Text>
          </View>

          {/* From / To */}
          <View style={styles.partySection}>
            <View style={styles.partyCard}>
              <Text style={styles.partyLabel}>FROM</Text>
              <Text style={styles.partyName}>{formData.fromName}</Text>
              <Text style={styles.partyDetail}>{formData.fromEmail}</Text>
            </View>
            <View style={styles.partyDivider}>
              <Feather name="arrow-right" size={20} color={Colors.gray300} />
            </View>
            <View style={[styles.partyCard, {alignItems: 'flex-end'}]}>
              <Text style={styles.partyLabel}>BILL TO</Text>
              <Text style={styles.partyName}>{formData.toName}</Text>
              <Text style={styles.partyDetail}>{formData.toEmail}</Text>
            </View>
          </View>

          {/* Job Details Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 2}]}>Service</Text>
              <Text style={[styles.tableHeaderText, {flex: 1, textAlign: 'right'}]}>
                Amount
              </Text>
            </View>
            <View style={styles.tableRow}>
              <View style={{flex: 2}}>
                <Text style={styles.serviceName}>{formData.jobPostName}</Text>
                {formData.description ? (
                  <Text style={styles.serviceDescription} numberOfLines={3}>
                    {formData.description}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.serviceAmount, {flex: 1, textAlign: 'right'}]}>
                ${formData.price}
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${formData.price}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.invoiceFooter}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerSubtext}>
              Generated by Cleaner Choice
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {!viewOnly && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <GradientButton
            title={generating ? 'Generating...' : 'Generate & Share'}
            onPress={handleGenerateAndShare}
            loading={generating}
            disabled={generating}
            style={styles.generateButton}
            textStyle={styles.generateButtonText}
          />
        </View>
      )}
    </View>
  );
};

export default InvoicePreview;

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
    paddingBottom: RFPercentage(14),
  },
  invoiceDocument: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    shadowColor: Colors.shadowBlueGrayLight,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: RFPercentage(2),
  },
  companyName: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.4),
    color: Colors.gradient1,
    marginTop: RFPercentage(0.5),
  },
  companySubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  invoiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
  },
  invoiceTitle: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.8),
    color: Colors.primaryText,
    letterSpacing: 2,
  },
  invoiceIdText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  divider: {
    height: 3,
    backgroundColor: Colors.gradient1,
    borderRadius: 2,
    marginBottom: RFPercentage(2),
  },
  dueDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberBg100,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(0.8),
    marginBottom: RFPercentage(2.5),
    gap: RFPercentage(0.6),
  },
  dueDateText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.amberDarkText,
  },
  dueDateValue: {
    fontFamily: Fonts.semiBold,
  },
  partySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(2.5),
  },
  partyCard: {
    flex: 1,
  },
  partyDivider: {
    paddingHorizontal: RFPercentage(1),
    paddingTop: RFPercentage(2),
  },
  partyLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.2),
    color: Colors.secondaryText,
    letterSpacing: 1,
    marginBottom: RFPercentage(0.5),
  },
  partyName: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  partyDetail: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    borderRadius: RFPercentage(1.2),
    overflow: 'hidden',
    marginBottom: RFPercentage(2),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBg,
  },
  tableHeaderText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.3),
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(2),
    alignItems: 'flex-start',
  },
  serviceName: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
  },
  serviceDescription: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 4,
  },
  serviceAmount: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: RFPercentage(2.5),
  },
  totalBox: {
    backgroundColor: Colors.gray50,
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  totalLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
  totalAmount: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.3),
    color: Colors.gradient1,
  },
  invoiceFooter: {
    alignItems: 'center',
    paddingTop: RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
  },
  footerText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  footerSubtext: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.gray400,
    marginTop: 2,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    gap: RFPercentage(1.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
  },
  editButton: {
    flex: 2,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1.5,
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  editButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  generateButton: {
    flex: 3,
    width: undefined,
    borderRadius: RFPercentage(1.5),
    height: RFPercentage(6),
  },
  generateButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
});
