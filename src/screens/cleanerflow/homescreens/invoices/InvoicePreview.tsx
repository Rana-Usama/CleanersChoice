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
import {Invoice, InvoiceFormData} from '../../../../types/invoice';
import {
  generateInvoicePdf,
  shareInvoicePdf,
  downloadInvoicePdf,
  saveInvoiceToFirestore,
  checkExistingInvoiceForJob,
  generateInvoiceId,
  getPaymentStatus,
  deleteInvoice,
} from '../../../../services/invoiceService';
import {upsertCustomerFromInvoice} from '../../../../services/customerService';
import MarkAsPaidSheet from '../../../../components/MarkAsPaidSheet';
import StatusPill from '../../../../components/StatusPill';
import {
  canRevertToUnpaid,
  markAsPaid,
  REVERT_WINDOW_LABEL,
  revertToUnpaid,
} from '../../../../services/paymentService';
import DeleteInvoiceDialog from '../../../../components/DeleteInvoiceDialog';

const InvoicePreview = ({route, navigation}: any) => {
  const {
    formData,
    jobItem,
    viewOnly,
    invoice,
    paymentActionsDisabled,
  }: {
    formData: InvoiceFormData;
    jobItem: any | null;
    viewOnly?: boolean;
    invoice?: Invoice;
    paymentActionsDisabled?: boolean;
  } =
    route.params;
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(
    invoice || null,
  );
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const paymentStatus = paymentInvoice
    ? getPaymentStatus(paymentInvoice)
    : 'unpaid';
  const isPaid = paymentStatus === 'paid';
  const canRevert = paymentInvoice ? canRevertToUnpaid(paymentInvoice) : false;
  const canManagePayment = !paymentActionsDisabled;
  const canDeleteInvoice = !paymentActionsDisabled && !!paymentInvoice?.id;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const pdfPath = await generateInvoicePdf(formData);
      await downloadInvoicePdf(pdfPath, formData.invoiceId);
      if (Platform.OS === 'android') {
        showToast({
          type: 'success',
          title: 'Downloaded',
          message: 'Invoice downloaded successfully',
        });
      }
    } catch (error: any) {
      if (
        !error?.message?.includes('User did not share') &&
        !error?.message?.includes('cancel')
      ) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to download invoice',
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateAndShare = async () => {
    setGenerating(true);
    try {
      // Check if invoice already exists for this job (only for job-based invoices)
      if (jobItem?.id) {
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
      }

      // Generate unique invoice ID at save time
      const uniqueInvoiceId = generateInvoiceId();
      const finalFormData = {...formData, invoiceId: uniqueInvoiceId};

      // Generate PDF with the final unique invoice ID
      const pdfPath = await generateInvoicePdf(finalFormData);

      // Save to Firestore
      await saveInvoiceToFirestore(
        finalFormData,
        jobItem?.id || '',
        jobItem?.jobId || '',
        pdfPath,
      );

      // Fire-and-forget Phone Book upsert. Failures are swallowed inside the
      // service so they never block the invoice flow.
      upsertCustomerFromInvoice(finalFormData, {
        phone: finalFormData.customerPhone,
        address: finalFormData.customerAddress,
      });

      showToast({
        type: 'success',
        title: 'Invoice Created',
        message: 'Invoice saved and PDF generated',
      });

      // Share PDF
      try {
        await shareInvoicePdf(pdfPath, finalFormData.invoiceId, finalFormData.toEmail, finalFormData.toName, finalFormData.jobPostName);
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

  const handleConfirmPaid = async (opts: {paidAt: Date; method: string}) => {
    if (!paymentInvoice?.id || paymentLoading) return;

    const previous = paymentInvoice;
    setPaymentLoading(true);
    setPaymentSheetVisible(false);
    setPaymentInvoice(prev =>
      prev
        ? {
            ...prev,
            paymentStatus: 'paid',
            paidAt: opts.paidAt,
            paymentMethod: opts.method,
          }
        : prev,
    );

    try {
      await markAsPaid(paymentInvoice.id, {
        paidAt: opts.paidAt,
        method: opts.method,
      });
      showToast({
        type: 'success',
        title: 'Marked as paid',
        message: 'Invoice payment status updated',
      });
    } catch (error: any) {
      setPaymentInvoice(previous);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to mark invoice as paid',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!paymentInvoice?.id || !canRevert || paymentLoading) return;

    const previous = paymentInvoice;
    setPaymentLoading(true);
    setPaymentInvoice(prev =>
      prev
        ? {
            ...prev,
            paymentStatus: 'unpaid',
            paidAt: null,
            paymentMethod: '',
          }
        : prev,
    );

    try {
      await revertToUnpaid(paymentInvoice.id);
      showToast({
        type: 'success',
        title: 'Reverted',
        message: 'Invoice moved to Unpaid',
      });
    } catch (error: any) {
      setPaymentInvoice(previous);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to revert invoice',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!paymentInvoice?.id || deleteLoading) return;

    setDeleteLoading(true);
    try {
      await deleteInvoice(paymentInvoice);
      showToast({
        type: 'success',
        title: 'Invoice deleted',
        message: '',
      });
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to delete invoice. Try again.',
        message: '',
      });
    } finally {
      setDeleteLoading(false);
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
          {canDeleteInvoice ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDeleteDialogVisible(true)}
              style={styles.deleteHeaderButton}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={RFPercentage(2.4)}
                color={Colors.white}
              />
            </TouchableOpacity>
          ) : (
            <View style={{width: 40}} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Invoice Document */}
        <View style={styles.invoiceDocument}>
          {/* Invoice title + ID */}
          <View style={styles.invoiceTitleRow}>
            <View style={{flex: 1}}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              {viewOnly && paymentInvoice ? (
                <View style={styles.previewStatusWrap}>
                  <StatusPill status={paymentStatus} size="md" />
                </View>
              ) : null}
            </View>
            <Text style={styles.invoiceIdText}>{formData.invoiceId}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Date */}
          <View style={styles.dueDateBar}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={RFPercentage(1.8)}
              color={Colors.secondaryText}
            />
            <Text style={styles.dueDateText}>
              Date:{' '}
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
              <Text style={styles.partyLabel}>BILLED TO</Text>
              <Text style={styles.partyName}>{formData.toName}</Text>
              <Text style={styles.partyDetail}>{formData.toEmail}</Text>
            </View>
          </View>

          {/* Job Details Table */}
          <View style={styles.tableContainer}>
            {formData.budgetType === 'hourly' ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, {flex: 2}]}>Service</Text>
                  <Text style={[styles.tableHeaderText, {flex: 1.1, textAlign: 'center'}]}>
                    Rate/hr
                  </Text>
                  <Text style={[styles.tableHeaderText, {flex: 1.3, textAlign: 'right'}]} numberOfLines={1}>
                    Total hours
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
                  <Text style={[styles.serviceAmount, {flex: 1.1, textAlign: 'center'}]}>
                    {formData.hourlyRate}/hr
                  </Text>
                  <Text style={[styles.serviceAmount, {flex: 1.3, textAlign: 'right'}]}>
                    {formData.hours ? String(formData.hours).padStart(2, '0') : '00'}
                  </Text>
                </View>
              </>
            ) : formData.budgetType === 'sqft' ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, {flex: 2}]}>Service</Text>
                  <Text style={[styles.tableHeaderText, {flex: 1, textAlign: 'left', paddingLeft: RFPercentage(1)}]}>
                    Rate/sqft
                  </Text>
                  <Text style={[styles.tableHeaderText, {flex: 1, textAlign: 'right'}]}>
                    Total/sqft
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
                  <Text style={[styles.serviceAmount, {flex: 1, textAlign: 'left', paddingLeft: RFPercentage(1)}]}>
                    {formData.pricePerSqFt}
                  </Text>
                  <Text style={[styles.serviceAmount, {flex: 1, textAlign: 'right'}]}>
                    {formData.sqFt || '0'}
                  </Text>
                </View>
              </>
            ) : (
              <>
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
                  <View style={{flex: 1, alignItems: 'flex-end'}}>
                    <Text style={styles.serviceAmount}>
                      {formData.price.startsWith('$') ? formData.price : `$${formData.price}`}
                    </Text>
                    <Text style={styles.budgetTypeLabel}>Flat Rate</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formData.price.startsWith('$') ? formData.price : `$${formData.price}`}</Text>
            </View>
          </View>

          {/* Footer — only rendered when there is payment-related info to show */}
          {(viewOnly && isPaid && paymentInvoice?.paymentMethod) ||
          (viewOnly && canManagePayment && isPaid && !canRevert) ? (
            <View style={styles.invoiceFooter}>
              {viewOnly && isPaid && paymentInvoice?.paymentMethod ? (
                <Text style={styles.paymentMeta}>
                  Paid via {paymentInvoice.paymentMethod}
                </Text>
              ) : null}
              {viewOnly && canManagePayment && isPaid && !canRevert ? (
                <Text style={styles.revertHelper}>
                  Revert is locked because payments can only be reverted within{' '}
                  {REVERT_WINDOW_LABEL}.
                </Text>
              ) : null}
            </View>
          ) : null}
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
            title={'Generate & Share'}
            onPress={handleGenerateAndShare}
            disabled={generating}
            style={styles.generateButton}
            textStyle={styles.generateButtonText}
          />
        </View>
      )}

      {/* Download Action for viewOnly */}
      {viewOnly && (
        <View style={styles.actionBar}>
          {canManagePayment && paymentInvoice && !isPaid ? (
            <GradientButton
              title={'Mark as Paid'}
              onPress={() => setPaymentSheetVisible(true)}
              loading={paymentLoading}
              disabled={paymentLoading}
              style={styles.markPaidButton}
              textStyle={styles.generateButtonText}
            />
          ) : null}
          {canManagePayment && paymentInvoice && isPaid ? (
            <TouchableOpacity
              style={[
                styles.revertButton,
                !canRevert && styles.revertButtonDisabled,
              ]}
              activeOpacity={canRevert ? 0.8 : 1}
              onPress={handleRevert}
              disabled={!canRevert || paymentLoading}>
              {paymentLoading ? (
                <ActivityIndicator
                  size="small"
                  color={canRevert ? Colors.amber500 : Colors.gray400}
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="undo-variant"
                    size={RFPercentage(2)}
                    color={canRevert ? Colors.amber500 : Colors.gray400}
                  />
                  <Text
                    style={[
                      styles.revertButtonText,
                      !canRevert && styles.revertButtonTextDisabled,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    Revert
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
          <GradientButton
            title={'Download Invoice'}
            onPress={handleDownload}
            loading={downloading}
            disabled={downloading}
            style={styles.downloadButton}
            textStyle={styles.generateButtonText}
          />
        </View>
      )}

      <MarkAsPaidSheet
        visible={paymentSheetVisible}
        invoiceId={paymentInvoice?.invoiceId}
        amount={paymentInvoice?.price || formData.price}
        toName={paymentInvoice?.toName || formData.toName}
        loading={paymentLoading}
        onClose={() => {
          if (!paymentLoading) setPaymentSheetVisible(false);
        }}
        onConfirm={handleConfirmPaid}
      />

      <DeleteInvoiceDialog
        visible={deleteDialogVisible}
        invoiceId={paymentInvoice?.invoiceId || formData.invoiceId}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setDeleteDialogVisible(false);
        }}
        onConfirm={handleConfirmDelete}
      />
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
  deleteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redOverlay20,
    borderWidth: 1,
    borderColor: Colors.whiteOverlay30,
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
  invoiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(1),
  },
  invoiceTitle: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.2),
    color: Colors.primaryText,
    letterSpacing: 2,
  },
  previewStatusWrap: {
    marginTop: RFPercentage(0.8),
  },
  invoiceIdText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    textAlign: 'right',
    maxWidth: '48%',
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
    backgroundColor: Colors.gray50,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(0.8),
    marginBottom: RFPercentage(2.5),
    gap: RFPercentage(0.6),
  },
  dueDateText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
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
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: '#4C5469',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(2),
    alignItems: 'flex-start',
  },
  serviceName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: '#4C5469',
  },
  serviceDescription: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: '#9CA3AF',
    marginTop: 4,
  },
  serviceAmount: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: '#4C5469',
  },
  budgetTypeLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: RFPercentage(2.5),
  },
  totalBox: {
    backgroundColor: Colors.gray50,
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(0.8),
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
  paymentMeta: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.35),
    color: Colors.green800,
    marginTop: RFPercentage(0.8),
  },
  revertHelper: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.25),
    color: Colors.gray400,
    marginTop: RFPercentage(0.7),
    textAlign: 'center',
    lineHeight: RFPercentage(2),
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
    flex: 1.5,
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
    flex: 3.5,
    width: undefined,
    borderRadius: RFPercentage(1.5),
    height: RFPercentage(6),
  },
  generateButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
  downloadButton: {
    flex: 1,
    width: undefined,
    borderRadius: RFPercentage(1.5),
    height: RFPercentage(6),
  },
  markPaidButton: {
    flex: 1,
    width: undefined,
    borderRadius: RFPercentage(1.5),
    height: RFPercentage(6),
  },
  revertButton: {
    flex: 0.7,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberBg50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1),
  },
  revertButtonDisabled: {
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
  },
  revertButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
    color: Colors.amberDarkText,
  },
  revertButtonTextDisabled: {
    color: Colors.gray400,
  },
});
