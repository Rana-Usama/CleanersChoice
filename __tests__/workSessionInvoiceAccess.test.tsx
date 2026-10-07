import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import InvoicePreview from '../src/screens/cleanerflow/homescreens/invoices/InvoicePreview';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

let mockWork: any;
let mockPaidSheet: any;
let mockDeleteSheet: any;
const mockMarkPaid = jest.fn();
const mockDeleteInvoice = jest.fn();
jest.mock('../src/components/work/WorkSessionProvider', () => ({useWorkSessions: () => mockWork}));
jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-responsive-fontsize', () => ({RFPercentage: (value: number) => value}));
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/components/GradientButton', () => 'Button');
jest.mock('../src/components/StatusPill', () => 'Status');
jest.mock('../src/components/MarkAsPaidSheet', () => (props: any) => {mockPaidSheet = props; return null;});
jest.mock('../src/components/DeleteInvoiceDialog', () => (props: any) => {mockDeleteSheet = props; return null;});
jest.mock('../src/utils/ToastMessage', () => ({showToast: jest.fn()}));
jest.mock('../src/services/customerService', () => ({upsertCustomerFromInvoice: jest.fn()}));
jest.mock('../src/services/invoiceService', () => ({
  getPaymentStatus: (invoice: any) => invoice.paymentStatus || 'unpaid',
  deleteInvoice: (...args: any[]) => mockDeleteInvoice(...args),
}));
jest.mock('../src/services/paymentService', () => ({
  canRevertToUnpaid: () => false, markAsPaid: (...args: any[]) => mockMarkPaid(...args),
  revertToUnpaid: jest.fn(), REVERT_WINDOW_LABEL: '24 hours',
}));
const invoice = {id: 'invoice', invoiceId: 'INV-1', dueDate: new Date(), jobPostName: 'Cleaning',
  description: 'Cleaning', price: '50', fromName: 'Cleaner', fromEmail: 'cleaner@example.com',
  cleanerCompanyName: 'Cleaner', toName: 'Customer', toEmail: 'customer@example.com', paymentStatus: 'unpaid'};
const navigation = {goBack: jest.fn(), navigate: jest.fn()};
const element = () => <InvoicePreview route={{params: {invoice, formData: invoice, viewOnly: true}}} navigation={navigation} />;
beforeEach(() => {
  jest.clearAllMocks();
  mockWork = {now: 1000, user: {role: 'Cleaner', subscriptionEndDate: 2000,
    instructionsAccepted: true, instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
    name: 'Cleaner', phone: '+1-321-659-6898', serviceLocation: {city: 'Austin', state: 'TX', latitude: 30, longitude: -97}}};
});

it('closes a payment sheet already open at expiry and prevents its remaining callback from writing', async () => {
  let renderer!: Renderer.ReactTestRenderer;
  await act(async () => {renderer = Renderer.create(element());});
  await act(async () => {renderer.root.findByProps({title: 'Mark as Paid'}).props.onPress();});
  expect(mockPaidSheet.visible).toBe(true);
  mockWork = {...mockWork, now: 2000};
  await act(async () => {renderer.update(element());});
  expect(mockPaidSheet.visible).toBe(false);
  await act(async () => {await mockPaidSheet.onConfirm({paidAt: new Date(), method: 'Cash'});});
  expect(mockMarkPaid).not.toHaveBeenCalled();
  expect(renderer.root.findAllByProps({title: 'Mark as Paid'})).toHaveLength(0);
  expect(renderer.root.findAllByProps({title: 'Download Invoice'}).length).toBeGreaterThan(0);
  await act(async () => {renderer.unmount();});
});

it('keeps existing invoice download access while rejecting delete callbacks after expiry', async () => {
  mockWork.now = 2000;
  let renderer!: Renderer.ReactTestRenderer;
  await act(async () => {renderer = Renderer.create(element());});
  await act(async () => {await mockDeleteSheet.onConfirm();});
  expect(mockDeleteInvoice).not.toHaveBeenCalled();
  expect(renderer.root.findAllByProps({title: 'Download Invoice'}).length).toBeGreaterThan(0);
  await act(async () => {renderer.unmount();});
});
