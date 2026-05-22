import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Customer,
  CustomerFormData,
  CustomerSource,
  CustomerValidationErrors,
} from '../types/customer';
import {Invoice, InvoiceFormData} from '../types/invoice';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const CUSTOMERS_COLLECTION = 'Customers';
const SEED_FLAG_KEY = (cleanerId: string) => `phonebook_seeded_${cleanerId}`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose international phone check: allow digits, spaces, dashes, parens, plus.
// Requires at least 7 digits when stripped.
const PHONE_DIGITS_REGEX = /\d/g;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const normalize = (value?: string | null): string =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Build a deterministic match key used for duplicate detection and idempotent
 * upserts. Prefers (name + email); falls back to (name + phone) when email is
 * empty so contacts seeded from phone-only records still dedupe correctly.
 */
export const buildMatchKey = (
  name?: string | null,
  email?: string | null,
  phone?: string | null,
): string => {
  const n = normalize(name);
  const e = normalize(email);
  if (e) return `${n}|${e}`;
  const p = (phone || '').replace(/[^0-9]/g, '');
  if (p) return `${n}|p:${p}`;
  return n;
};

const requireAuth = (): string => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uid;
};

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

export const validateCustomerForm = (
  form: CustomerFormData,
): CustomerValidationErrors => {
  const errors: CustomerValidationErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required';
  }

  if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = 'Invalid email format';
  }

  if (form.phone.trim()) {
    const digits = (form.phone.match(PHONE_DIGITS_REGEX) || []).length;
    if (digits < 7) errors.phone = 'Phone number looks too short';
  }

  return errors;
};

// ----------------------------------------------------------------------------
// Reads
// ----------------------------------------------------------------------------

/**
 * Fetch every customer belonging to the current cleaner, sorted by name in JS
 * to avoid requiring a composite index (matches the invoice list pattern).
 */
export const getCustomers = async (): Promise<Customer[]> => {
  const cleanerId = requireAuth();
  const snapshot = await firestore()
    .collection(CUSTOMERS_COLLECTION)
    .where('cleanerId', '==', cleanerId)
    .get();

  const list: Customer[] = snapshot.docs.map(doc => {
    const data = doc.data() as Omit<Customer, 'id'>;
    return {id: doc.id, ...data} as Customer;
  });

  list.sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, {sensitivity: 'base'}),
  );

  return list;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const doc = await firestore().collection(CUSTOMERS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return {id: doc.id, ...(doc.data() as Omit<Customer, 'id'>)} as Customer;
};

/**
 * Find an existing customer for the current cleaner by match key. Returns
 * null if none. Used for duplicate detection on create and by the upsert flow.
 */
export const findCustomerByMatchKey = async (
  matchKey: string,
): Promise<Customer | null> => {
  if (!matchKey) return null;
  const cleanerId = requireAuth();
  const snapshot = await firestore()
    .collection(CUSTOMERS_COLLECTION)
    .where('cleanerId', '==', cleanerId)
    .where('matchKey', '==', matchKey)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {id: doc.id, ...(doc.data() as Omit<Customer, 'id'>)} as Customer;
};

// ----------------------------------------------------------------------------
// Writes
// ----------------------------------------------------------------------------

const buildCreatePayload = (
  form: CustomerFormData,
  cleanerId: string,
  source: CustomerSource,
  invoiceCount = 0,
  lastInvoicedAt: any = null,
): Omit<Customer, 'id'> => ({
  cleanerId,
  name: form.name.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  address: form.address.trim(),
  notes: form.notes.trim(),
  source,
  matchKey: buildMatchKey(form.name, form.email, form.phone),
  invoiceCount,
  lastInvoicedAt,
  createdAt: firestore.FieldValue.serverTimestamp(),
  updatedAt: firestore.FieldValue.serverTimestamp(),
});

export const createCustomer = async (
  form: CustomerFormData,
  source: CustomerSource = 'manual',
): Promise<string> => {
  const cleanerId = requireAuth();
  const payload = buildCreatePayload(form, cleanerId, source);
  const docRef = await firestore().collection(CUSTOMERS_COLLECTION).add(payload);
  return docRef.id;
};

export const updateCustomer = async (
  id: string,
  form: CustomerFormData,
): Promise<void> => {
  await firestore()
    .collection(CUSTOMERS_COLLECTION)
    .doc(id)
    .update({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      matchKey: buildMatchKey(form.name, form.email, form.phone),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await firestore().collection(CUSTOMERS_COLLECTION).doc(id).delete();
};

// ----------------------------------------------------------------------------
// Upsert from invoice (called after a successful invoice save)
// ----------------------------------------------------------------------------

/**
 * Create or update a Phone Book entry from the invoice that was just saved.
 * - Match key prefers (toName + toEmail), falling back to (toName + phone).
 * - On match: bumps invoiceCount, refreshes lastInvoicedAt, fills any empty
 *   fields the invoice can provide (phone/address) without overwriting
 *   manual edits.
 * - On miss: creates a contact with source: 'auto'.
 *
 * Safe to call fire-and-forget — never throws into the caller's flow.
 */
export const upsertCustomerFromInvoice = async (
  invoice: InvoiceFormData | Invoice,
  extra?: {phone?: string; address?: string},
): Promise<string | null> => {
  try {
    const cleanerId = requireAuth();
    const name = (invoice as any).toName || '';
    const email = (invoice as any).toEmail || '';
    const phone = extra?.phone || (invoice as any).customerPhone || '';
    const address = extra?.address || (invoice as any).customerAddress || '';

    if (!name.trim()) return null;

    const matchKey = buildMatchKey(name, email, phone);
    const existing = await findCustomerByMatchKey(matchKey);

    if (existing && existing.id) {
      const patch: any = {
        invoiceCount: firestore.FieldValue.increment(1),
        lastInvoicedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      if (!existing.phone && phone) patch.phone = phone;
      if (!existing.address && address) patch.address = address;
      if (!existing.email && email) patch.email = email;
      await firestore()
        .collection(CUSTOMERS_COLLECTION)
        .doc(existing.id)
        .update(patch);
      return existing.id;
    }

    const payload = buildCreatePayload(
      {name, email, phone, address, notes: ''},
      cleanerId,
      'auto',
      1,
      firestore.FieldValue.serverTimestamp(),
    );
    const docRef = await firestore()
      .collection(CUSTOMERS_COLLECTION)
      .add(payload);
    return docRef.id;
  } catch (error) {
    console.error('[customerService.upsertCustomerFromInvoice]', error);
    return null;
  }
};

// ----------------------------------------------------------------------------
// One-shot seed from existing invoices
// ----------------------------------------------------------------------------

/**
 * Backfill the Phone Book from invoices already in Firestore.
 * Idempotent — guarded by an AsyncStorage flag so it runs only once per
 * cleaner per device. Safe to call on screen mount; failures are swallowed.
 *
 * Returns the number of new contacts created (0 if skipped).
 */
export const seedPhoneBookFromInvoices = async (): Promise<number> => {
  try {
    const cleanerId = requireAuth();
    const flagKey = SEED_FLAG_KEY(cleanerId);
    const alreadySeeded = await AsyncStorage.getItem(flagKey);
    if (alreadySeeded === 'yes') return 0;

    const invoicesSnapshot = await firestore()
      .collection('Invoices')
      .where('cleanerId', '==', cleanerId)
      .get();

    if (invoicesSnapshot.empty) {
      await AsyncStorage.setItem(flagKey, 'yes');
      return 0;
    }

    // Group invoices by match key (one Customer per unique key).
    const grouped = new Map<
      string,
      {name: string; email: string; phone: string; address: string; count: number; latest: any}
    >();

    invoicesSnapshot.docs.forEach(doc => {
      const inv = doc.data() as Invoice;
      const name = (inv.toName || '').trim();
      if (!name) return;
      const email = (inv.toEmail || '').trim();
      const key = buildMatchKey(name, email, '');
      const prev = grouped.get(key);
      const createdAt = inv.createdAt;
      if (prev) {
        prev.count += 1;
        // Track the most recent createdAt.
        const prevTime = prev.latest?.toDate?.()?.getTime?.() ?? 0;
        const curTime = createdAt?.toDate?.()?.getTime?.() ?? 0;
        if (curTime > prevTime) prev.latest = createdAt;
      } else {
        grouped.set(key, {
          name,
          email,
          phone: '',
          address: '',
          count: 1,
          latest: createdAt,
        });
      }
    });

    if (grouped.size === 0) {
      await AsyncStorage.setItem(flagKey, 'yes');
      return 0;
    }

    // Skip contacts that already exist (in case a partial seed ran before
    // the flag was set — keeps the operation idempotent across crashes).
    const existing = await getCustomers();
    const existingKeys = new Set(existing.map(c => c.matchKey));

    let created = 0;
    const batch = firestore().batch();
    const collectionRef = firestore().collection(CUSTOMERS_COLLECTION);

    for (const [key, entry] of grouped) {
      if (existingKeys.has(key)) continue;
      const docRef = collectionRef.doc();
      const payload: Omit<Customer, 'id'> = {
        cleanerId,
        name: entry.name,
        email: entry.email,
        phone: '',
        address: '',
        notes: '',
        source: 'auto',
        matchKey: key,
        invoiceCount: entry.count,
        lastInvoicedAt: entry.latest || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      batch.set(docRef, payload);
      created += 1;
    }

    if (created > 0) {
      await batch.commit();
    }
    await AsyncStorage.setItem(flagKey, 'yes');
    return created;
  } catch (error) {
    console.error('[customerService.seedPhoneBookFromInvoices]', error);
    // Do NOT set the flag on failure — let it retry on next mount.
    return 0;
  }
};

// ----------------------------------------------------------------------------
// Pure utilities (UI layer)
// ----------------------------------------------------------------------------

export const filterCustomers = (
  customers: Customer[],
  query: string,
): Customer[] => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return customers;
  return customers.filter(c => {
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  });
};

export const customerToFormData = (c: Customer): CustomerFormData => ({
  name: c.name || '',
  email: c.email || '',
  phone: c.phone || '',
  address: c.address || '',
  notes: c.notes || '',
});
