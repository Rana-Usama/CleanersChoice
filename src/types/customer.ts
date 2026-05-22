// Customer (Phone Book) types
// Per-cleaner directory of contacts used to auto-fill invoice Bill To fields.

export type CustomerSource = 'manual' | 'auto';

export interface Customer {
  id?: string;
  cleanerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  source: CustomerSource;
  // Normalized lookup keys used to detect duplicates and idempotent upserts.
  // Stored lowercased + whitespace-collapsed.
  matchKey: string;
  invoiceCount: number;
  lastInvoicedAt: any | null;
  createdAt: any;
  updatedAt: any;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface CustomerValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}
