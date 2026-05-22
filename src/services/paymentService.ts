import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Invoice, PaymentStatus} from '../types/invoice';

const INVOICES = 'Invoices';
const REVERT_WINDOW_DAYS = 30;

const requireAuthUid = (): string => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uid;
};

/**
 * Robustly read paidAt as a Date regardless of whether Firestore returned
 * a Timestamp, a Date, an ISO string, or null.
 */
const paidAtToDate = (paidAt: any): Date | null => {
  if (!paidAt) return null;
  if (paidAt instanceof Date) return paidAt;
  if (typeof paidAt?.toDate === 'function') return paidAt.toDate();
  if (typeof paidAt === 'string' || typeof paidAt === 'number') {
    const d = new Date(paidAt);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Pure helper — true while the invoice can still be reverted to Unpaid.
 * Allowed only inside the 30-day window from paidAt.
 */
export const canRevertToUnpaid = (invoice: Invoice): boolean => {
  if (invoice.paymentStatus !== 'paid') return false;
  const paidAt = paidAtToDate(invoice.paidAt);
  if (!paidAt) return false;
  const ageMs = Date.now() - paidAt.getTime();
  const windowMs = REVERT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return ageMs >= 0 && ageMs <= windowMs;
};

/**
 * Mark an invoice as paid using a transaction.
 *
 * The transaction re-reads the document and aborts if it's already paid —
 * this prevents two devices (or a double-tap) from racing the same write.
 *
 * @param invoiceId    Firestore document id
 * @param opts.paidAt  Optional payment date (defaults to server time)
 * @param opts.method  Optional human label: "Cash" | "Card" | "Bank Transfer" | "Other" | custom
 */
export const markAsPaid = async (
  invoiceId: string,
  opts?: {paidAt?: Date; method?: string},
): Promise<void> => {
  const uid = requireAuthUid();
  const ref = firestore().collection(INVOICES).doc(invoiceId);

  await firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Invoice not found');
    const data = snap.data() as Invoice;
    if (data.cleanerId !== uid) throw new Error('Not authorized');
    if (data.paymentStatus === 'paid') {
      // Idempotent no-op — already paid, do nothing.
      return;
    }

    const paidAtValue =
      opts?.paidAt instanceof Date
        ? firestore.Timestamp.fromDate(opts.paidAt)
        : firestore.FieldValue.serverTimestamp();

    tx.update(ref, {
      paymentStatus: 'paid' as PaymentStatus,
      paidAt: paidAtValue,
      paymentMethod: (opts?.method || '').trim(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Revert a paid invoice back to unpaid. Only allowed inside the 30-day
 * window from the recorded paidAt. The transaction re-checks both the
 * status and the window to defend against tampered local state.
 */
export const revertToUnpaid = async (invoiceId: string): Promise<void> => {
  const uid = requireAuthUid();
  const ref = firestore().collection(INVOICES).doc(invoiceId);

  await firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Invoice not found');
    const data = snap.data() as Invoice;
    if (data.cleanerId !== uid) throw new Error('Not authorized');
    if (data.paymentStatus !== 'paid') return;
    if (!canRevertToUnpaid(data)) {
      throw new Error(
        `Cannot revert — payments older than ${REVERT_WINDOW_DAYS} days are locked`,
      );
    }

    tx.update(ref, {
      paymentStatus: 'unpaid' as PaymentStatus,
      paidAt: null,
      paymentMethod: '',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

export const REVERT_WINDOW_LABEL = `${REVERT_WINDOW_DAYS} days`;
