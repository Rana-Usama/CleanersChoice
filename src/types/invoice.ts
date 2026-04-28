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
