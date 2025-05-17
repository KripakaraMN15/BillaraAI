export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type PaymentTerms = 'Net 15' | 'Net 30' | 'Net 60' | 'Custom';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessGST?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  currency: string;
  items: LineItem[];
  taxPercent: number;
  discountPercent: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  baseAmount?: number;
  penaltyAmount?: number;
  lastPenaltyUpdateAt?: string;
  lastReminderSentAt?: string;
  notes: string;
  status: InvoiceStatus;
  public?: boolean;
  createdAt: string;
  updatedAt: string;
}
