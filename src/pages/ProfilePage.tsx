import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ImageIcon, Upload, Loader2, Mail, Phone, Hash, 
  Building2, Save, CheckCircle2, User as UserIcon 
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setFormData({
          businessName: data.businessName || '',
          businessAddress: data.businessAddress || '',
          businessEmail: data.businessEmail || '',
          businessPhone: data.businessPhone || '',
          businessGST: data.businessGST || '',
          logoUrl: data.logoUrl || '',
          stampUrl: data.stampUrl || '',
          signatureUrl: data.signatureUrl || '',
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleFileUpload = (field: 'logoUrl' | 'stampUrl' | 'signatureUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!auth.currentUser || !profile) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updates = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Business Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Changes saved
              </motion.div>
            )}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-100 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
        {/* Brand Identity */}
        <section>
          <div className="mb-6">
            <h2 className="text-lg font-bold">Brand Identity</h2>
            <p className="text-sm text-neutral-500">Visual elements that identify your business on invoices.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'logoUrl', label: 'Company Logo', icon: Building2, desc: 'Shown at the top of invoices' },
              { id: 'stampUrl', label: 'Official Stamp', icon: ImageIcon, desc: 'Placed at the bottom of the page' },
              { id: 'signatureUrl', label: 'Authorized Signature', icon: Upload, desc: 'Validates your documents' }
            ].map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-900">{item.label}</span>
                  <span className="text-[11px] text-neutral-400">{item.desc}</span>
                </div>
                <label className="group relative cursor-pointer block">
                  <div className="aspect-square bg-white rounded-[32px] border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center overflow-hidden group-hover:border-neutral-900 transition-all hover:shadow-xl hover:shadow-neutral-200/50">
                    {(formData as any)[item.id] ? (
                      <img src={(formData as any)[item.id]} className="w-full h-full object-contain p-6" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mb-3 text-neutral-300">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-neutral-400">Click to upload</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload(item.id as any)} 
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Business Information */}
        <section className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm space-y-8">
          <div>
            <h2 className="text-lg font-bold">Business Details</h2>
            <p className="text-sm text-neutral-500">Official contact and registration information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Legal Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                <input 
                  type="text"
                  value={formData.businessName || ''}
                  onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300"
                  placeholder="e.g. Acme Studio Inc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Registration / GST No.</label>
              <div className="relative">
                <Hash className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                <input 
                  type="text"
                  value={formData.businessGST || ''}
                  onChange={e => setFormData(p => ({ ...p, businessGST: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                <input 
                  type="email"
                  value={formData.businessEmail || ''}
                  onChange={e => setFormData(p => ({ ...p, businessEmail: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300"
                  placeholder="billing@yourbusiness.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                <input 
                  type="text"
                  value={formData.businessPhone || ''}
                  onChange={e => setFormData(p => ({ ...p, businessPhone: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">Full Business Address</label>
            <textarea 
              value={formData.businessAddress || ''}
              onChange={e => setFormData(p => ({ ...p, businessAddress: e.target.value }))}
              rows={4}
              className="w-full px-5 py-4 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100 outline-none transition-all placeholder:text-neutral-300 resize-none"
              placeholder="Building name, Street address, City, State, Country, ZIP Code"
            />
          </div>
        </section>

        {/* User Account Info (Read Only) */}
        <section className="px-10 py-8 bg-neutral-100 rounded-[32px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-neutral-400 border border-neutral-200">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Authenticated Account</p>
              <p className="text-sm font-bold text-neutral-600">{auth.currentUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="px-6 py-2.5 bg-white text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors border border-neutral-200"
          >
            Logout session
          </button>
        </section>
      </main>
    </div>
  );
}
