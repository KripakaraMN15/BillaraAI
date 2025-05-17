import { forwardRef } from 'react';
import { Invoice, UserProfile, CURRENCIES } from '../types';
import { format } from 'date-fns';

interface Props {
  invoice: Invoice;
  userProfile?: UserProfile | null;
}

const InvoicePreview = forwardRef<HTMLDivElement, Props>(({ invoice, userProfile }, ref) => {
  const currency = CURRENCIES.find(c => c.code === invoice.currency) || CURRENCIES[0];
  const symbol = currency.symbol;

  return (
    <div 
      id="invoice-content"
      ref={ref}
      className="w-full h-full p-12 bg-white shadow-2xl overflow-y-auto print:shadow-none print:p-0"
      style={{ minHeight: '1120px' }} // A4 ratio approximately
    >
      <div className="flex justify-between items-start mb-16">
        <div>
          {userProfile?.logoUrl ? (
            <img src={userProfile.logoUrl} alt="Logo" className="h-16 mb-6 grayscale" />
          ) : (
            <div className="h-16 w-16 bg-neutral-900 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-2xl">
              {userProfile?.businessName?.[0] || 'I'}
            </div>
          )}
          <h2 className="text-xl font-bold">{userProfile?.businessName || 'Business Name'}</h2>
          <p className="text-neutral-500 text-sm whitespace-pre-wrap max-w-xs mb-2">{userProfile?.businessAddress || 'Address'}</p>
          <div className="space-y-0.5">
            {userProfile?.businessEmail && <p className="text-neutral-400 text-xs">{userProfile.businessEmail}</p>}
            {userProfile?.businessPhone && <p className="text-neutral-400 text-xs">{userProfile.businessPhone}</p>}
            {userProfile?.businessGST && <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">GST: {userProfile.businessGST}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-5xl font-serif mb-4 uppercase tracking-tighter">Invoice</h1>
          <p className="text-neutral-500 text-sm">#{invoice.invoiceNumber}</p>
          <div className="mt-8 space-y-1">
            <div className="flex justify-end gap-4">
              <span className="text-neutral-400 text-xs uppercase font-bold tracking-widest">Issued</span>
              <span className="text-sm">{invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM d, yyyy') : '-'}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-neutral-400 text-xs uppercase font-bold tracking-widest">Due</span>
              <span className="text-sm font-bold">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-16 border-t border-b border-neutral-100 py-12">
        <div>
          <span className="text-neutral-400 text-xs uppercase font-bold tracking-widest block mb-4">Bill To</span>
          <h3 className="font-bold text-lg mb-1">{invoice.clientName || 'Client Name'}</h3>
          <p className="text-neutral-500 text-sm whitespace-pre-wrap">{invoice.clientAddress || 'Client Address'}</p>
          <p className="text-neutral-500 text-sm mt-1">{invoice.clientEmail}</p>
        </div>
        <div>
          <span className="text-neutral-400 text-xs uppercase font-bold tracking-widest block mb-4">Status</span>
          <div className="inline-block p-1 bg-neutral-50 border border-neutral-200 rounded px-3 text-xs font-bold uppercase tracking-widest">
            {invoice.status}
          </div>
        </div>
      </div>

      <table className="w-full mb-16">
        <thead>
          <tr className="border-b-2 border-neutral-900 text-xs font-bold uppercase tracking-widest">
            <th className="py-4 text-left">Description</th>
            <th className="py-4 text-right px-4">Qty</th>
            <th className="py-4 text-right px-4">Price</th>
            <th className="py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td className="py-6 text-sm">{item.description}</td>
              <td className="py-6 text-right px-4 text-sm">{item.quantity || 0}</td>
              <td className="py-6 text-right px-4 text-sm">{symbol}{(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="py-6 text-right text-sm font-bold">{symbol}{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span>{symbol}{(invoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {(invoice.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount ({invoice.discountPercent || 0}%)</span>
              <span>-{symbol}{(invoice.discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {(invoice.taxAmount || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Tax ({invoice.taxPercent || 0}%)</span>
              <span>+{symbol}{(invoice.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {(invoice.penaltyAmount || 0) > 0 && (
            <div className="flex justify-between text-sm text-red-600 font-bold">
              <span>Late Penalty (10% Daily)</span>
              <span>+{symbol}{(invoice.penaltyAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="pt-6 border-t-2 border-neutral-900 flex justify-between items-end">
            <span className="text-xs uppercase font-bold tracking-widest">Total Amount</span>
            <span className="text-3xl font-serif">{symbol}{(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="mt-24 flex justify-between items-end">
        <div className="flex-1 italic text-neutral-400 text-sm">
          <span className="font-bold text-neutral-900 not-italic block mb-2 tracking-widest uppercase text-xs">Notes & Terms</span>
          <p className="whitespace-pre-wrap">{invoice.notes || 'Default payment terms and conditions apply.'}</p>
        </div>
        
        <div className="flex items-center gap-12 ml-12">
          {userProfile?.stampUrl && (
            <div className="text-center">
              <img 
                src={userProfile.stampUrl} 
                alt="Stamp" 
                className="h-20 w-20 object-contain opacity-90" 
                crossOrigin="anonymous"
              />
              <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-300 mt-2">Official Stamp</p>
            </div>
          )}
          {userProfile?.signatureUrl && (
            <div className="text-center">
              <img 
                src={userProfile.signatureUrl} 
                alt="Signature" 
                className="h-16 w-32 object-contain border-b border-neutral-200" 
                crossOrigin="anonymous"
              />
              <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-300 mt-2">Authorized Signature</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-24 text-center text-xs text-neutral-300 font-bold uppercase tracking-[0.2em]">
        Generated via BillaraAI
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
