import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice, UserProfile } from '../types';
import InvoicePreview from '../components/InvoicePreview';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { useRef } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function PublicInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Invoice-${invoice?.invoiceNumber || 'download'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (!id) return;

    const fetchPublicInvoice = async () => {
      try {
        const snap = await getDoc(doc(db, 'publicInvoices', id));
        if (snap.exists()) {
          const data = snap.data() as Invoice;
          setInvoice(data);
          
          // Fetch business details from the user who created it
          const userSnap = await getDoc(doc(db, 'users', data.userId));
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          }
        } else {
          setError('Invoice not found or no longer public.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
        <p className="text-neutral-500 font-medium">Securing document...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-neutral-500 max-w-sm mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 flex flex-col items-center gap-8 print:py-0 print:px-0 print:bg-white">
      <div className="w-full max-w-3xl flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center text-white text-[10px] font-bold">
            BA
          </div>
          <span className="font-bold text-sm tracking-tight">BillaraAI</span>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-bold shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <div className="w-full max-w-3xl shadow-2xl print:shadow-none print:max-w-full">
        <InvoicePreview invoice={invoice} userProfile={userProfile} ref={componentRef} />
      </div>

      <div className="text-neutral-400 text-xs py-8 print:hidden">
        Secure invoice powered by <span className="font-bold text-neutral-900">BillaraAI</span>
      </div>
    </div>
  );
}
