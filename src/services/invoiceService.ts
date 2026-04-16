import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import {Platform} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {Invoice, InvoiceFormData, InvoiceValidationErrors} from '../types/invoice';

// Check if an invoice already exists for a specific job by the current cleaner
export const checkExistingInvoiceForJob = async (
  jobId: string,
): Promise<Invoice | null> => {
  const user = auth().currentUser;
  if (!user) return null;

  const snapshot = await firestore()
    .collection('Invoices')
    .where('jobId', '==', jobId)
    .where('cleanerId', '==', user.uid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return {id: snapshot.docs[0].id, ...snapshot.docs[0].data()} as Invoice;
  }
  return null;
};

// Generate a unique invoice ID using timestamp + random hex
// Format: INV-YYYYMMDD-XXXXXXXX (date + 8-char unique suffix)
export const generateInvoiceId = (): string => {
  const today = moment().format('YYYYMMDD');
  const hex = (Date.now().toString(36) + Math.random().toString(36).substring(2, 8))
    .toUpperCase()
    .substring(0, 8);
  return `INV-${today}-${hex}`;
};

// Create an invoice draft from job and user data
export const createInvoiceDraftFromJob = (
  job: any,
  cleanerData: any,
  customerData: any,
): InvoiceFormData => {
  return {
    invoiceId: generateInvoiceId(),
    dueDate: new Date(),
    jobPostName: job.title || '',
    description: job.description || '',
    price: job.priceRange || '',
    budgetType: job.budgetType || 'flat',
    hourlyRate: job.hourlyRate ? `$${job.hourlyRate}` : '',
    hours: job.hours || '',
    pricePerSqFt: job.pricePerSqFt ? `$${job.pricePerSqFt}` : '',
    sqFt: job.sqFt || '',
    fromName: cleanerData?.companyName || cleanerData?.name || '',
    fromEmail: cleanerData?.email || '',
    cleanerCompanyName: cleanerData?.companyName || cleanerData?.name || '',
    toName: customerData?.name || '',
    toEmail: customerData?.email || '',
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInvoiceForm = (
  form: InvoiceFormData,
): InvoiceValidationErrors => {
  const errors: InvoiceValidationErrors = {};

  if (!form.jobPostName.trim()) errors.jobPostName = 'Job name is required';
  if (!form.price.trim()) errors.price = 'Price is required';
  if (!form.cleanerCompanyName.trim())
    errors.cleanerCompanyName = 'Name is required';
  if (!form.fromEmail.trim()) {
    errors.fromEmail = 'Your email is required';
  } else if (!EMAIL_REGEX.test(form.fromEmail)) {
    errors.fromEmail = 'Invalid email format';
  }
  if (!form.cleanerCompanyName.trim())
    errors.cleanerCompanyName = 'Name is required';
  if (!form.toName.trim()) errors.toName = 'Customer name is required';
  if (!form.toEmail.trim()) {
    errors.toEmail = 'Customer email is required';
  } else if (!EMAIL_REGEX.test(form.toEmail)) {
    errors.toEmail = 'Invalid email format';
  }

  return errors;
};

// Generate HTML template for the invoice
export const generateInvoiceHtml = (invoice: InvoiceFormData): string => {
  const dueDate = moment(invoice.dueDate).format('MMM DD, YYYY');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; background: #fff; padding: 40px; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #407BFF; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: 700; color: #407BFF; margin-bottom: 4px; }
    .invoice-title { font-size: 32px; font-weight: 700; color: #1E293B; text-align: right; }
    .invoice-id { font-size: 14px; color: #64748B; text-align: right; margin-top: 4px; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .info-block { flex: 1; }
    .info-block h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #334155; margin-bottom: 8px; font-weight: 600; }
    .info-block p { font-size: 14px; color: #475569; line-height: 1.6; }
    .info-block .name { font-size: 16px; font-weight: 600; color: #1E293B; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .details-table th { background: #F1F5F9; padding: 12px 16px; text-align: left; font-size: 12px; letter-spacing: 0.5px; color: #4C5469; font-weight: 600; border-bottom: 2px solid #E2E8F0; }
    .details-table td { padding: 16px; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #4C5469; font-weight: 500; }
    .details-table .description { color: #9CA3AF; font-size: 13px; margin-top: 4px; font-weight: 400; }
    .total-section { display: flex; justify-content: flex-end; margin-top: 16px; }
    .total-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 32px; min-width: 250px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 16px; font-weight: 600; color: #475569; }
    .total-amount { font-size: 28px; font-weight: 700; color: #407BFF; }
    .due-date-section { margin-bottom: 32px; padding: 12px 16px; background: #F8FAFC; border-left: 4px solid #94A3B8; border-radius: 0 4px 4px 0; }
    .due-date-section span { font-size: 13px; color: #475569; }
    .due-date-section strong { color: #1E293B; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="company-name">Cleaners Choice</div>
      <p style="font-size:13px;color:#475569;">Professional cleaning service</p>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-id">${escapeHtml(invoice.invoiceId)}</div>
    </div>
  </div>

  <div class="due-date-section">
    <span>Date: <strong>${escapeHtml(dueDate)}</strong></span>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>From</h3>
      <p class="name">${escapeHtml(invoice.fromName)}</p>
      <p>${escapeHtml(invoice.fromEmail)}</p>
    </div>
    <div class="info-block" style="text-align:right;">
      <h3>Billed To</h3>
      <p class="name">${escapeHtml(invoice.toName)}</p>
      <p>${escapeHtml(invoice.toEmail)}</p>
    </div>
  </div>

  <table class="details-table">
    <thead>
      <tr>
        ${invoice.budgetType === 'hourly' ? `
        <th style="width:50%">Service</th>
        <th style="width:25%;text-align:center;">Rate/hr</th>
        <th style="width:25%;text-align:right;">Total hours</th>
        ` : invoice.budgetType === 'sqft' ? `
        <th style="width:50%">Service</th>
        <th style="width:25%;text-align:left;">Rate/sqft</th>
        <th style="width:25%;text-align:right;">Area/sqft</th>
        ` : `
        <th style="width:70%">Service</th>
        <th style="width:30%;text-align:right;">Amount</th>
        `}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${escapeHtml(invoice.jobPostName)}</strong>
          ${invoice.description ? `<div class="description">${escapeHtml(invoice.description)}</div>` : ''}
        </td>
        ${invoice.budgetType === 'hourly' ? `
        <td style="text-align:center;font-weight:600;">${escapeHtml(invoice.hourlyRate)}/hr</td>
        <td style="text-align:right;font-weight:600;">${String(invoice.hours || '0').padStart(2, '0')}</td>
        ` : invoice.budgetType === 'sqft' ? `
        <td style="text-align:left;font-weight:600;">${escapeHtml(invoice.pricePerSqFt)}</td>
        <td style="text-align:right;font-weight:600;">${escapeHtml(invoice.sqFt || '0')}</td>
        ` : `
        <td style="text-align:right;font-weight:500;color:#4C5469;">${invoice.price.startsWith('$') ? invoice.price : `$${invoice.price}`}<br><span style="font-weight:400;font-size:12px;color:#9CA3AF;">Flat Rate</span></td>
        `}
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span class="total-label">Total</span>
        <span class="total-amount">${invoice.price.startsWith('$') ? escapeHtml(invoice.price) : `$${escapeHtml(invoice.price)}`}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p style="margin-top:4px;">Powered by Cleaners Choice App</p>
  </div>
</body>
</html>`;
};

// Escape HTML entities for safe PDF rendering
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Generate PDF from invoice data
export const generateInvoicePdf = async (
  invoice: InvoiceFormData,
): Promise<string> => {
  const html = generateInvoiceHtml(invoice);
  const options: any = {
    html,
    fileName: `Invoice_${invoice.invoiceId}`,
    ...(Platform.OS === 'ios' ? {directory: 'Documents'} : {}),
  };
  const file = await RNHTMLtoPDF.convert(options);
  if (!file.filePath) {
    throw new Error('Failed to generate PDF');
  }
  return file.filePath;
};

// Share a PDF file via the native share sheet
// When user picks Email, the To/Subject/Body are pre-filled
export const shareInvoicePdf = async (
  filePath: string,
  invoiceId: string,
  toEmail?: string,
  toName?: string,
  jobTitle?: string,
): Promise<void> => {
  const subject = jobTitle
    ? `Invoice for ${jobTitle} – Invoice #${invoiceId}`
    : `Invoice #${invoiceId}`;
  const message = jobTitle
    ? `Please find attached your invoice for "${jobTitle}" (Invoice #${invoiceId}).`
    : `Please find attached your invoice (Invoice #${invoiceId}).`;
  await Share.open({
    url: `file://${filePath}`,
    type: 'application/pdf',
    title: subject,
    subject,
    email: toEmail || undefined,
    message,
  });
};

// Download invoice PDF with system notification
// Android: saves to public Downloads via MediaStore, shows notification, tap opens file
// iOS: opens native share sheet so user can choose where to save
export const downloadInvoicePdf = async (
  filePath: string,
  invoiceId: string,
): Promise<void> => {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'downloads',
      name: 'Downloads',
      importance: AndroidImportance.LOW,
    });

    const notificationId = await notifee.displayNotification({
      title: 'Downloading Invoice',
      body: `Invoice ${invoiceId}`,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        progress: {indeterminate: true},
        ongoing: true,
      },
    });

    try {
      const fileName = `Invoice_${invoiceId}.pdf`;
      const contentUri =
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: '',
            mimeType: 'application/pdf',
          },
          'Download',
          filePath,
        );

      await notifee.displayNotification({
        id: notificationId,
        title: 'Invoice Downloaded',
        body: `Tap to open ${fileName}`,
        data: {
          contentUri,
          mimeType: 'application/pdf',
          type: 'invoice_download',
        },
        android: {
          channelId,
          smallIcon: 'ic_notification',
          ongoing: false,
          pressAction: {id: 'open_invoice'},
        },
      });
    } catch (error) {
      await notifee.cancelNotification(notificationId);
      throw error;
    }
  } else {
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/pdf',
      title: `Save Invoice ${invoiceId}`,
      subject: `Invoice ${invoiceId}`,
    });
  }
};

// Save invoice to Firestore (with duplicate job check)
export const saveInvoiceToFirestore = async (
  formData: InvoiceFormData,
  jobId: string,
  customerId: string,
  pdfPath?: string,
): Promise<string> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  // Double-check: prevent duplicate invoice for the same job
  const existing = await checkExistingInvoiceForJob(jobId);
  if (existing) {
    throw new Error(
      `Invoice ${existing.invoiceId} already exists for this job`,
    );
  }

  const invoiceData: Omit<Invoice, 'id'> = {
    invoiceId: formData.invoiceId,
    jobId,
    cleanerId: user.uid,
    customerId,
    dueDate: moment(formData.dueDate).toISOString(),
    jobPostName: formData.jobPostName,
    description: formData.description,
    price: formData.price,
    budgetType: formData.budgetType,
    hourlyRate: formData.hourlyRate,
    hours: formData.hours,
    pricePerSqFt: formData.pricePerSqFt,
    sqFt: formData.sqFt,
    fromName: formData.fromName,
    fromEmail: formData.fromEmail,
    cleanerCompanyName: formData.cleanerCompanyName,
    toName: formData.toName,
    toEmail: formData.toEmail,
    status: 'sent',
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    pdfPath: pdfPath || '',
  };

  const docRef = await firestore().collection('Invoices').add(invoiceData);
  return docRef.id;
};

// Convert Invoice to InvoiceFormData for PDF regeneration
export const invoiceToFormData = (invoice: Invoice): InvoiceFormData => ({
  invoiceId: invoice.invoiceId,
  dueDate: new Date(invoice.dueDate),
  jobPostName: invoice.jobPostName,
  description: invoice.description,
  price: invoice.price,
  budgetType: invoice.budgetType || 'flat',
  hourlyRate: invoice.hourlyRate || '',
  hours: invoice.hours || '',
  pricePerSqFt: invoice.pricePerSqFt || '',
  sqFt: invoice.sqFt || '',
  fromName: invoice.fromName,
  fromEmail: invoice.fromEmail,
  cleanerCompanyName: invoice.cleanerCompanyName,
  toName: invoice.toName,
  toEmail: invoice.toEmail,
});

// Filter invoices by search query
export const filterInvoices = (
  invoices: Invoice[],
  searchQuery: string,
): Invoice[] => {
  if (!searchQuery.trim()) return invoices;
  const q = searchQuery.toLowerCase();
  return invoices.filter(
    inv =>
      inv.invoiceId.toLowerCase().includes(q) ||
      inv.toName.toLowerCase().includes(q),
  );
};

// Paginate invoices
export const paginateInvoices = (
  invoices: Invoice[],
  page: number,
  perPage: number = 10,
): Invoice[] => {
  const start = (page - 1) * perPage;
  return invoices.slice(start, start + perPage);
};
