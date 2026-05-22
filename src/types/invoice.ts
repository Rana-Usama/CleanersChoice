// Payment status — independent of the legacy `status: 'sent'` field which
// is preserved to keep the PDF/email flow untouched.
export type PaymentStatus = 'unpaid' | 'paid';

export interface Invoice {
  id?: string;
  invoiceId: string;
  jobId: string;
  cleanerId: string;
  customerId: string;
  dueDate: string;
  jobPostName: string;
  description: string;
  price: string;
  budgetType?: 'flat' | 'hourly' | 'sqft';
  hourlyRate?: string;
  hours?: string;
  pricePerSqFt?: string;
  sqFt?: string;
  fromName: string;
  fromEmail: string;
  cleanerCompanyName: string;
  toName: string;
  toEmail: string;
  status: 'sent';
  createdAt: any;
  updatedAt: any;
  pdfPath?: string;
  // Payment tracking — optional on the type to remain backward compatible
  // with already-saved invoices that pre-date this feature. Reads must
  // default missing values to 'unpaid' / null.
  paymentStatus?: PaymentStatus;
  paidAt?: any | null;
  paymentMethod?: string;
}

export interface InvoiceFormData {
  invoiceId: string;
  dueDate: Date;
  jobPostName: string;
  description: string;
  price: string;
  budgetType: 'flat' | 'hourly' | 'sqft';
  hourlyRate: string;
  hours: string;
  pricePerSqFt: string;
  sqFt: string;
  fromName: string;
  fromEmail: string;
  cleanerCompanyName: string;
  toName: string;
  toEmail: string;
  // Phone Book extras — not part of the printable invoice. Carried on the
  // form so they can be used to upsert the contact after save.
  customerPhone?: string;
  customerAddress?: string;
}

export interface InvoiceValidationErrors {
  dueDate?: string;
  jobPostName?: string;
  price?: string;
  fromName?: string;
  fromEmail?: string;
  cleanerCompanyName?: string;
  toName?: string;
  toEmail?: string;
}
