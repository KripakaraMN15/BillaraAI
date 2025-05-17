import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Download, Plus, Trash2, 
  Sparkles, Mail, FileText, Loader2, CheckCircle, Image as ImageIcon,
  Phone, Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CURRENCIES, Invoice, LineItem, UserProfile, InvoiceStatus, PaymentTerms } from '../types';
import InvoicePreview from '../components/InvoicePreview';
import { parseInvoiceBrief, generateInvoiceEmail, polishNotes } from '../lib/gemini';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const DEFAULT_INVOICE: Partial<Invoice> = {
  invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  paymentTerms: 'Net 15',
  currency: 'USD',
  items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
  taxPercent: 0,
  discountPercent: 0,
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
  notes: '',
  status: 'Draft',
};

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Partial<Invoice>>(DEFAULT_INVOICE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefText, setBriefText] = useState('');
  
  const componentRef = useRef<HTMLDivElement>(null);
  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Invoice-${invoice.invoiceNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (snap.exists()) setUserProfile(snap.data() as UserProfile);
    };
    fetchProfile();

    if (id) {
      const fetchInvoice = async () => {
        const snap = await getDoc(doc(db, 'users', auth.currentUser!.uid, 'invoices', id));
        if (snap.exists()) {
          setInvoice(snap.data() as Invoice);
        }
      };
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    // Recalculate totals
    const subtotal = (invoice.items || []).reduce((acc, item) => acc + (item.total || 0), 0) || 0;
    const discountAmount = (subtotal * (invoice.discountPercent || 0)) / 100 || 0;
    const taxAmount = ((subtotal - discountAmount) * (invoice.taxPercent || 0)) / 100 || 0;
    const totalAmount = subtotal - discountAmount + taxAmount || 0;
    
    // Penalties logic: If there's an existing baseAmount, totalAmount is baseAmount + penalty
    // Otherwise, we initialize baseAmount with totalAmount
    const baseAmount = invoice.baseAmount !== undefined ? invoice.baseAmount : totalAmount;
    const penaltyAmount = invoice.penaltyAmount || 0;
    const finalTotal = invoice.penaltyAmount ? baseAmount + penaltyAmount : totalAmount;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: finalTotal,
      baseAmount,
    }));
  }, [invoice.items, invoice.taxPercent, invoice.discountPercent, invoice.penaltyAmount]);

  const handleItemChange = (itemId: string, field: keyof LineItem, value: any) => {
    setInvoice(prev => {
      const newItems = (prev.items || []).map(item => {
        if (item.id === itemId) {
          const val = (field === 'quantity' || field === 'unitPrice') ? (value || 0) : value;
          const updatedItem = { ...item, [field]: val };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setInvoice(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const removeItem = (itemId: string) => {
    setInvoice(prev => ({
      ...prev,
      items: (prev.items || []).filter(i => i.id !== itemId)
    }));
  };

  const saveInvoice = async (targetStatus?: InvoiceStatus) => {
    if (!auth.currentUser) return;
    setSaving(true);
    const status = targetStatus || invoice.status || 'Draft';
    const finalInvoice = {
      ...invoice,
      status,
      userId: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
      createdAt: invoice.createdAt || new Date().toISOString(),
      id: id || doc(collection(db, 'tmp')).id
    } as Invoice;

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'invoices', finalInvoice.id);
      await setDoc(docRef, finalInvoice);
      
      // Also save a public copy if it's "Sent" or beyond
      if (status !== 'Draft') {
        await setDoc(doc(db, 'publicInvoices', finalInvoice.id), { ...finalInvoice, public: true });
      }

      setInvoice(finalInvoice);
      if (!id) navigate(`/invoice/edit/${finalInvoice.id}`, { replace: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/invoices/${finalInvoice.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAiFill = async () => {
    setAiLoading(true);
    try {
      const data = await parseInvoiceBrief(briefText);
      const items = data.items || [];
      const formattedItems = items.map((item: any, i: number) => ({
        id: Date.now().toString() + i,
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0)
      }));
      
      setInvoice(prev => ({ 
        ...prev, 
        items: formattedItems,
        clientName: data.clientName || prev.clientName,
        clientEmail: data.clientEmail || prev.clientEmail,
        clientAddress: data.clientAddress || prev.clientAddress,
        taxPercent: data.taxPercent !== undefined ? data.taxPercent : prev.taxPercent,
        discountPercent: data.discountPercent !== undefined ? data.discountPercent : prev.discountPercent,
      }));
      setBriefOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePolishNotes = async () => {
    if (!invoice.notes) return;
    setAiLoading(true);
    try {
      const polished = await polishNotes(invoice.notes);
      setInvoice(prev => ({ ...prev, notes: polished }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.clientEmail) return alert('No client email provided');
    const businessName = userProfile?.businessName || 'BillaraAI';
    
    setAiLoading(true);
    try {
      // 1. Generate PDF base64
      const element = document.getElementById('invoice-content');
      if (!element) throw new Error('Invoice content not found');
      
      const opt = {
        margin: 0,
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      // Get PDF as base64 data URI string
      const pdfDataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      // Extract just the base64 part
      const base64Content = pdfDataUri.split(';base64,')[1];

      // 2. Generate email body
      const emailBody = await generateInvoiceEmail(invoice);
      
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.clientEmail,
          businessName: businessName,
          subject: `Invoice ${invoice.invoiceNumber} from ${businessName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="font-size: 24px; margin-bottom: 20px;">New Invoice from ${businessName}</h2>
              <p style="white-space: pre-wrap; margin-bottom: 30px; line-height: 1.6;">${emailBody}</p>
              <div style="background: #f9f9f9; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #eee;">
                <h3 style="margin-top: 0; font-size: 16px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Invoice Summary</h3>
                <p style="margin: 10px 0;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                <p style="margin: 10px 0;"><strong>Amount Due:</strong> <strong style="font-size: 20px;">${CURRENCIES.find(c => c.code === invoice.currency)?.symbol || '$'}${invoice.totalAmount?.toLocaleString()}</strong></p>
                <p style="margin: 10px 0;"><strong>Due Date:</strong> ${invoice.dueDate}</p>
              </div>
              <p style="margin-bottom: 30px; color: #666; font-size: 14px;">We have attached a PDF copy of the invoice for your records.</p>
              <p style="margin-top: 40px; border-top: 1px solid #eee; pt: 20px; color: #999; font-size: 12px; text-align: center;">
                Sent via ${businessName}
              </p>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              content: base64Content,
            }
          ]
        })
      });

      if (res.ok) {
        alert('Invoice sent with PDF attachment!');
        await saveInvoice('Sent');
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send email');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error sending email: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Top Bar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-neutral-200" />
          <h1 className="font-bold text-lg">
            {id ? `Edit Invoice ${invoice.invoiceNumber}` : 'Create New Invoice'}
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-neutral-200 bg-neutral-50`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => saveInvoice()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-neutral-50 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button 
            onClick={handleSendEmail}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to Client
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Left Sidebar - Inputs */}
        <aside className="w-1/2 overflow-y-auto bg-white border-r border-neutral-200 p-8 space-y-12 print:hidden">
          
          {/* AI Brief Section */}
          <div className="p-6 bg-neutral-900 text-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neutral-400" />
                <h3 className="font-bold">AI Assistant</h3>
              </div>
              <button 
                onClick={() => setBriefOpen(!briefOpen)}
                className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-white transition-colors"
              >
                {briefOpen ? 'Close' : 'Open'}
              </button>
            </div>
            {briefOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <textarea 
                  value={briefText}
                  onChange={e => setBriefText(e.target.value)}
                  placeholder="Paste work description... e.g. 'Bill John Doe (john@doe.com) for 3 hours of logo design at $50/hr with 5% tax and 10% discount'"
                  className="w-full h-32 bg-neutral-800 border-none rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-neutral-700 mb-4 resize-none"
                />
                <button 
                  onClick={handleAiFill}
                  disabled={aiLoading || !briefText}
                  className="w-full py-2 bg-white text-neutral-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-900" /> : <Sparkles className="w-4 h-4" />}
                  Auto-fill Invoice Details
                </button>
              </motion.div>
            )}
            {!briefOpen && (
              <p className="text-xs text-neutral-400">Describe your work and client in plain English to auto-fill details.</p>
            )}
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Your Business</h3>
              <Link 
                to="/profile"
                className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
            <Link 
              to="/profile"
              className="flex items-start gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 group hover:border-neutral-900 transition-all block"
            >
              <div className="w-16 h-16 bg-white rounded-xl border border-neutral-100 flex items-center justify-center overflow-hidden shadow-sm">
                {userProfile?.logoUrl ? (
                  <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-neutral-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate mb-1">
                  {userProfile?.businessName || 'Brand Name'}
                </div>
                <div className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">
                  {userProfile?.businessAddress || 'Business Address'}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {userProfile?.businessEmail && (
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                      <Mail className="w-3 h-3" /> {userProfile.businessEmail}
                    </div>
                  )}
                  {userProfile?.businessPhone && (
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                      <Phone className="w-3 h-3" /> {userProfile.businessPhone}
                    </div>
                  )}
                  {userProfile?.businessGST && (
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                      <Hash className="w-3 h-3" /> GST: {userProfile.businessGST}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </section>

          <section className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-100">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Bill To</h3>
              <input 
                type="text" 
                placeholder="Client Name"
                value={invoice.clientName || ''}
                onChange={e => setInvoice(p => ({ ...p, clientName: e.target.value }))}
                className="w-full font-bold border-none p-0 focus:ring-0 placeholder-neutral-400"
              />
              <input 
                type="email" 
                placeholder="Client Email"
                value={invoice.clientEmail || ''}
                onChange={e => setInvoice(p => ({ ...p, clientEmail: e.target.value }))}
                className="w-full text-sm border-none p-0 focus:ring-0 placeholder-neutral-400"
              />
              <textarea 
                placeholder="Client Address"
                value={invoice.clientAddress || ''}
                onChange={e => setInvoice(p => ({ ...p, clientAddress: e.target.value }))}
                rows={2}
                className="w-full text-sm text-neutral-500 border-none p-0 focus:ring-0 placeholder-neutral-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Invoice Number</label>
                <input 
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={e => setInvoice(p => ({ ...p, invoiceNumber: e.target.value }))}
                  className="w-full text-sm font-bold border-b border-neutral-100 py-1 focus:border-neutral-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Issue Date</label>
                  <input 
                    type="date"
                    value={invoice.issueDate}
                    onChange={e => setInvoice(p => ({ ...p, issueDate: e.target.value }))}
                    className="w-full text-sm border-b border-neutral-100 py-1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Due Date</label>
                  <input 
                    type="date"
                    value={invoice.dueDate}
                    onChange={e => setInvoice(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full text-sm border-b border-neutral-100 py-1 font-bold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Payment Terms</label>
                <select 
                  value={invoice.paymentTerms}
                  onChange={e => setInvoice(p => ({ ...p, paymentTerms: e.target.value as PaymentTerms }))}
                  className="w-full text-sm border-b border-neutral-100 py-1 bg-transparent"
                >
                  {['Net 15', 'Net 30', 'Net 60', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Currency</label>
                <select 
                  value={invoice.currency}
                  onChange={e => setInvoice(p => ({ ...p, currency: e.target.value }))}
                  className="w-full text-sm border-b border-neutral-100 py-1 bg-transparent font-bold"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="pt-8 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Line Items</h3>
              <button 
                onClick={addItem}
                className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-neutral-900 hover:opacity-70"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {invoice.items?.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="flex-1">
                    <input 
                      type="text"
                      placeholder="Item name"
                      value={item.description}
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full text-sm border-b border-neutral-50 px-0 py-2 focus:border-neutral-900 outline-none transition-colors"
                    />
                  </div>
                  <div className="w-16">
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border-b border-neutral-50 px-0 py-2 text-right focus:border-neutral-900 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="number"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border-b border-neutral-50 px-0 py-2 text-right focus:border-neutral-900 outline-none"
                    />
                  </div>
                  <div className="w-24 flex items-center justify-end px-0 py-2 text-sm font-bold">
                    {CURRENCIES.find(c => c.code === invoice.currency)?.symbol || '$'}{item.total.toLocaleString()}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all shadow-sm rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-8 border-t border-neutral-100 max-w-xs ml-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400 uppercase tracking-widest text-[10px] font-bold">Tax %</span>
                <input 
                  type="number" 
                  value={invoice.taxPercent}
                  onChange={e => setInvoice(p => ({ ...p, taxPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-16 text-right border-none p-0 focus:ring-0 font-bold"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400 uppercase tracking-widest text-[10px] font-bold">Discount %</span>
                <input 
                  type="number" 
                  value={invoice.discountPercent}
                  onChange={e => setInvoice(p => ({ ...p, discountPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-16 text-right border-none p-0 focus:ring-0 font-bold text-red-600"
                />
              </div>
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-sm font-bold">Grand Total</span>
                <span className="text-2xl font-serif tracking-tighter">
                  {CURRENCIES.find(c => c.code === invoice.currency)?.symbol || '$'}
                  {invoice.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </section>

          <section className="pt-8 border-t border-neutral-100 p-6 bg-neutral-50 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Notes & Terms</h3>
              <button 
                onClick={handlePolishNotes}
                disabled={aiLoading || !invoice.notes}
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-neutral-600 bg-white border border-neutral-200 px-2 py-1 rounded hover:bg-neutral-100"
              >
                <Sparkles className="w-3 h-3" /> Polish with AI
              </button>
            </div>
            <textarea 
              value={invoice.notes}
              onChange={e => setInvoice(p => ({ ...p, notes: e.target.value }))}
              placeholder="Add payment instructions, terms, etc."
              rows={4}
              className="w-full text-sm bg-transparent border-none p-0 focus:ring-0 placeholder-neutral-300 resize-none italic"
            />
          </section>
        </aside>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-neutral-100 overflow-y-auto p-12 flex justify-center print:p-0 print:bg-white">
          <div className="w-[800px] h-fit print:w-full">
            <InvoicePreview invoice={invoice as Invoice} userProfile={userProfile} ref={componentRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
