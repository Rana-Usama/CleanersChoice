import {Invoice} from '../types/invoice';

export interface MonthlyEarning {
  month: number;
  label: string;
  shortLabel: string;
  total: number;
  count: number;
}

export interface TopCustomerEarning {
  customerId: string;
  name: string;
  email: string;
  total: number;
  count: number;
}

export interface AnnualEarningsSummary {
  year: number;
  total: number;
  previousYearTotal: number;
  yoyPercent: number | null;
  monthly: MonthlyEarning[];
  topCustomers: TopCustomerEarning[];
  paidInvoices: Invoice[];
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const paidAtToDate = (paidAt: any): Date | null => {
  if (!paidAt) return null;
  if (paidAt instanceof Date) return paidAt;
  if (typeof paidAt?.toDate === 'function') return paidAt.toDate();
  if (typeof paidAt === 'string' || typeof paidAt === 'number') {
    const date = new Date(paidAt);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const parseInvoiceAmount = (price: string): number => {
  const amount = Number(String(price || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const isCashBasisPaidInvoice = (invoice: Invoice): boolean =>
  invoice.paymentStatus === 'paid' && !!paidAtToDate(invoice.paidAt);

export const getInvoicePaidYear = (invoice: Invoice): number | null => {
  const paidAt = paidAtToDate(invoice.paidAt);
  return paidAt ? paidAt.getFullYear() : null;
};

export const getInvoicePaidMonth = (invoice: Invoice): number | null => {
  const paidAt = paidAtToDate(invoice.paidAt);
  return paidAt ? paidAt.getMonth() : null;
};

export const getPaidInvoiceYears = (
  invoices: Invoice[],
  currentYear: number = new Date().getFullYear(),
): number[] => {
  const years = new Set<number>();
  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    years.add(year);
  }
  invoices.forEach(invoice => {
    const paidYear = getInvoicePaidYear(invoice);
    if (paidYear) {
      years.add(paidYear);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
};

export const buildAnnualEarningsSummary = (
  invoices: Invoice[],
  year: number,
): AnnualEarningsSummary => {
  const monthly = MONTH_LABELS.map((label, month) => ({
    month,
    label,
    shortLabel: label.slice(0, 3),
    total: 0,
    count: 0,
  }));
  const customerTotals = new Map<string, TopCustomerEarning>();
  const paidInvoices = invoices
    .filter(invoice => isCashBasisPaidInvoice(invoice))
    .filter(invoice => getInvoicePaidYear(invoice) === year)
    .sort((a, b) => {
      const aTime = paidAtToDate(a.paidAt)?.getTime() || 0;
      const bTime = paidAtToDate(b.paidAt)?.getTime() || 0;
      return bTime - aTime;
    });

  paidInvoices.forEach(invoice => {
    const month = getInvoicePaidMonth(invoice);
    const amount = parseInvoiceAmount(invoice.price);
    if (month !== null) {
      monthly[month].total += amount;
      monthly[month].count += 1;
    }

    const customerKey =
      invoice.customerId ||
      `${invoice.toEmail || ''}:${invoice.toName || ''}` ||
      'unknown';
    const current = customerTotals.get(customerKey) || {
      customerId: invoice.customerId || customerKey,
      name: invoice.toName || 'Unknown customer',
      email: invoice.toEmail || '',
      total: 0,
      count: 0,
    };
    current.total += amount;
    current.count += 1;
    customerTotals.set(customerKey, current);
  });

  const total = paidInvoices.reduce(
    (sum, invoice) => sum + parseInvoiceAmount(invoice.price),
    0,
  );
  const previousYearTotal = invoices
    .filter(invoice => isCashBasisPaidInvoice(invoice))
    .filter(invoice => getInvoicePaidYear(invoice) === year - 1)
    .reduce((sum, invoice) => sum + parseInvoiceAmount(invoice.price), 0);
  const yoyPercent =
    previousYearTotal > 0
      ? ((total - previousYearTotal) / previousYearTotal) * 100
      : null;

  return {
    year,
    total,
    previousYearTotal,
    yoyPercent,
    monthly,
    topCustomers: Array.from(customerTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    paidInvoices,
  };
};

export const getMonthLabel = (month: number): string =>
  MONTH_LABELS[month] || '';
