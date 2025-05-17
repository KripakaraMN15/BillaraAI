import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CURRENCIES, Invoice, UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, CheckCircle, 
  Clock, AlertCircle, FileText, Trash2,
  TrendingUp, ArrowUpRight, LogOut, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO } from 'date-fns';
import { calculatePenalty } from '../lib/penalties';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) setUserProfile(snap.data() as UserProfile);
    });

    // Sub to invoices
    const invoicesRef = collection(db, 'users', auth.currentUser.uid, 'invoices');
    const q = query(invoicesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[];
      const sorted = docs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(sorted);
      setLoading(false);
      
      // Auto-trigger reminder/penalty check on load
      if (sorted.length > 0 && !automationRunning) {
        processAutomations(sorted);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/invoices`);
    });

    return () => unsubscribe();
  }, []);

  const processAutomations = async (currentInvoices: Invoice[]) => {
    if (!auth.currentUser || automationRunning) return;
    setAutomationRunning(true);

    try {
      const today = new Date();
      const updates = [];

      for (const inv of currentInvoices) {
        if (inv.status === 'Paid' || inv.status === 'Draft') continue;

        const { penaltyAmount, totalAmount, isOverdue } = calculatePenalty(inv);
        const lastUpdate = inv.lastPenaltyUpdateAt ? parseISO(inv.lastPenaltyUpdateAt) : null;
        const lastReminder = inv.lastReminderSentAt ? parseISO(inv.lastReminderSentAt) : null;

        let needsUpdate = false;
        const updateData: any = { updatedAt: new Date().toISOString() };

        // 1. Update Penalty & Status
        if (isOverdue) {
          if (inv.status !== 'Overdue') {
            updateData.status = 'Overdue';
            needsUpdate = true;
          }
          
          if (!lastUpdate || !isSameDay(lastUpdate, today)) {
            updateData.penaltyAmount = penaltyAmount;
            updateData.totalAmount = totalAmount;
            updateData.lastPenaltyUpdateAt = today.toISOString();
            needsUpdate = true;
          }
        }

        // 2. Check for reminders (Due today or Overdue)
        const isDueToday = inv.dueDate && isSameDay(parseISO(inv.dueDate), today);
        const shouldSendReminder = (isDueToday || isOverdue) && (!lastReminder || !isSameDay(lastReminder, today));

        if (shouldSendReminder) {
          // Send email via server
          const businessName = userProfile?.businessName || 'BillaraAI';
          const symbol = CURRENCIES.find(c => c.code === inv.currency)?.symbol || '$';
          
          try {
            await fetch('/api/send-reminder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: inv.clientEmail,
                businessName,
                subject: `Reminder: Invoice ${inv.invoiceNumber} is ${isDueToday ? 'due today' : 'past due'}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="font-size: 24px; margin-bottom: 20px;">Payment Reminder</h2>
                    <p style="line-height: 1.6;">Hello, this is a reminder regarding <strong>Invoice #${inv.invoiceNumber}</strong> from <strong>${businessName}</strong>.</p>
                    
                    <div style="background: #fff5f5; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #fed7d7;">
                      <h3 style="margin-top: 0; font-size: 14px; color: #c53030; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Current Status</h3>
                      <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #c53030;">
                        ${symbol}${totalAmount.toLocaleString()}
                      </p>
                      ${penaltyAmount > 0 ? `<p style="margin: 5px 0; color: #e53e3e; font-size: 14px;">Includes ${symbol}${penaltyAmount.toLocaleString()} in late fees (10% daily penalty applied)</p>` : ''}
                      <p style="margin: 15px 0 0 0; font-size: 14px;"><strong>Due Date:</strong> ${inv.dueDate}</p>
                    </div>

                    <p style="line-height: 1.6;">Please clear the outstanding amount at your earliest convenience to avoid further daily penalties.</p>
                    
                    <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 12px; text-align: center;">
                      Sent via BillaraAI Automation
                    </p>
                  </div>
                `
              })
            });
            updateData.lastReminderSentAt = today.toISOString();
            needsUpdate = true;
          } catch (e) {
            console.error('Failed to send auto-reminder', e);
          }
        }

        if (needsUpdate) {
          const invRef = doc(db, 'users', auth.currentUser.uid, 'invoices', inv.id);
          await updateDoc(invRef, updateData);
          // Also update public copy if it exists
          try {
            await updateDoc(doc(db, 'publicInvoices', inv.id), updateData);
          } catch (e) { /* ignore if public copy doesn't exist yet */ }
        }
      }
    } catch (e) {
      console.error('Automation error', e);
    } finally {
      setAutomationRunning(false);
    }
  };

  const stats = {
    totalRevenue: invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? inv.totalAmount : 0), 0),
    pendingAmount: invoices.reduce((acc, inv) => acc + (inv.status === 'Sent' ? inv.totalAmount : 0), 0),
    overdueAmount: invoices.reduce((acc, inv) => acc + (inv.status === 'Overdue' ? inv.totalAmount : 0), 0),
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!auth.currentUser || !confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'invoices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/invoices/${id}`);
    }
  };

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'invoices', inv.id), {
        status: 'Paid',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/invoices/${inv.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-sans">B</span>
            </div>
            <span className="font-bold text-lg tracking-tight">BillaraAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/invoice/new" 
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
            <div className="h-8 w-px bg-neutral-200 mx-2" />
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <Link 
              to="/profile"
              className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden hover:border-neutral-900 transition-all"
              title="Business Profile"
            >
              {userProfile?.logoUrl ? (
                <img src={userProfile.logoUrl} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-neutral-500" />
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h2>
          <p className="text-neutral-500">Welcome back, {userProfile?.displayName || 'Business Owner'}. Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Revenue', val: stats.totalRevenue, icon: TrendingUp, color: 'emerald' },
            { label: 'Pending Payment', val: stats.pendingAmount, icon: Clock, color: 'blue' },
            { label: 'Overdue Total', val: stats.overdueAmount, icon: AlertCircle, color: 'red' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-${stat.color}-50`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300" />
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">
                {CURRENCIES[0].symbol}{stat.val.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Table Content */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input 
                type="text"
                placeholder="Search clients, invoice #..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Number</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold">{inv.clientName}</div>
                      <div className="text-xs text-neutral-500">{inv.clientEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 font-medium">#{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-bold">
                      {CURRENCIES.find(c => c.code === inv.currency)?.symbol || '$'}
                      {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-sm">
                      {format(new Date(inv.issueDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status !== 'Paid' && (
                          <button 
                            onClick={() => handleMarkAsPaid(inv)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <Link 
                          to={`/invoice/edit/${inv.id}`}
                          className="p-2 text-neutral-600 hover:bg-white border hover:border-neutral-300 border-transparent rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && (
            <div className="p-20 text-center text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No invoices found. Create your first one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
