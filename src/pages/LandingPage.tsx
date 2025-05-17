import { motion } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Send, 
  Download, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      title: "AI-Powered Filling",
      description: "Describe your work in plain English and let our AI handle the itemization, taxes, and totals."
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: "Professional Templates",
      description: "Beautifully crafted, minimalist designs that make your business look like a Fortune 500 company."
    },
    {
      icon: <Send className="w-6 h-6 text-purple-600" />,
      title: "Direct Emailing",
      description: "Send invoices directly from the platform with automated professional cover emails."
    },
    {
      icon: <Download className="w-6 h-6 text-orange-600" />,
      title: "PDF Generation",
      description: "One-click high-fidelity PDF exports with support for multi-currency and global symbols."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
      title: "Secure Cloud Storage",
      description: "Every invoice is encrypted and safely stored, accessible from anywhere at any time."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
      title: "Payment Tracking",
      description: "Keep track of paid, overdue, and draft invoices with our intuitive unified dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-neutral-900 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center shadow-lg shadow-neutral-200">
              <span className="text-white font-bold text-xl font-sans">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900">BillaraAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
              Sign In
            </Link>
            <Link 
              to="/login" 
              className="px-5 py-2 bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-emerald-100/50">
              <Sparkles className="w-3 h-3" />
              Smart Invoicing for business
            </div>
            <h1 className="text-6xl md:text-7xl font-serif font-medium leading-[1.1] tracking-tighter text-neutral-900 mb-8">
              Invoices created in <span className="text-neutral-400 italic font-normal underline decoration-emerald-200">seconds</span>.
            </h1>
            <p className="text-xl text-neutral-500 leading-relaxed mb-10 max-w-lg">
              The smartest way for freelancers and agencies to bill clients. Just describe your work, and let AI build the document.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login" 
                className="px-8 py-4 bg-neutral-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98]"
              >
                Start Creating Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-3 px-6 text-sm text-neutral-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] uppercase font-bold text-neutral-400">
                      U{i}
                    </div>
                  ))}
                </div>
                Trusted by 2,000+ creators
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-emerald-100/50 blur-3xl rounded-full -z-10" />
            <div className="bg-white border border-neutral-100 shadow-2xl rounded-3xl p-8 transform rotate-2">
              <div className="border-b border-neutral-100 pb-6 mb-6 flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-2xl font-bold">INV-4209</h3>
                  <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Draft Preview</p>
                </div>
                <div className="px-3 py-1 bg-neutral-50 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Active Demo
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-neutral-50">
                  <span className="text-sm font-medium text-neutral-500">Logo Design Workshop</span>
                  <span className="text-sm font-bold">$1,200.00</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-50">
                  <span className="text-sm font-medium text-neutral-500">Brand Identity Assets</span>
                  <span className="text-sm font-bold">$850.00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-neutral-400">Tax (5%)</span>
                  <span className="text-sm font-medium text-neutral-400">$102.50</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Total Due</p>
                  <p className="text-3xl font-serif">$2,152.50</p>
                </div>
                <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            {/* Overlay AI bubble */}
            <div className="absolute -left-10 bottom-10 bg-neutral-900 text-white p-4 rounded-2xl shadow-xl max-w-[200px] border border-neutral-800 animate-bounce">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">AI Assistant</p>
              <p className="text-xs leading-relaxed">"I've added the logo design items and calculated the 5% regional tax as requested."</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-neutral-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif font-medium tracking-tight mb-4">Everything you need, nothing you don't.</h2>
            <p className="text-neutral-500 max-w-lg mx-auto">Stripped back to the essentials of what makes a professional invoice, then supercharged with intelligence.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 bg-white rounded-3xl border border-neutral-100 shadow-sm transition-all"
              >
                <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dummy Records / Dashboard Preview */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-serif font-medium tracking-tight mb-6">Manage at the scale of your ambition.</h2>
            <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
              Our unified dashboard gives you a panoramic view of your business health. Spot overdue payments, track monthly growth, and export financial data in seconds.
            </p>
            <div className="space-y-4">
              {[
                "Instant search for any client or invoice #",
                "Filter by status: Paid, Sent, Overdue or Draft",
                "Bulk export capabilities for tax season",
                "Real-time currency conversion"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="bg-neutral-900 rounded-[32px] p-8 shadow-2xl relative">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Monthly Revenue</div>
                  <div className="text-3xl font-serif text-white tracking-tighter">$14,240.00</div>
                </div>
                <div className="px-3 py-1 bg-emerald-900/40 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-800/50">
                  +12% vs last month
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { client: "Acme Corp", status: "Paid", amount: "3,500.00", date: "May 12" },
                  { client: "Stark Ind.", status: "Sent", amount: "1,200.00", date: "May 11" },
                  { client: "Wayne Ent.", status: "Overdue", amount: "5,800.00", date: "May 08" }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white">
                        {row.client[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{row.client}</div>
                        <div className="text-[10px] text-neutral-500">{row.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">${row.amount}</div>
                      <div className={`text-[10px] font-bold uppercase ${
                        row.status === 'Paid' ? 'text-emerald-400' : 
                        row.status === 'Sent' ? 'text-blue-400' : 'text-rose-400'
                      }`}>{row.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif font-medium tracking-tight mb-4 text-neutral-900">Simple, transparent pricing.</h2>
            <p className="text-neutral-500 max-w-lg mx-auto">Choose the plan that fits the scale of your business. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "499",
                description: "Perfect for new freelancers",
                features: ["100 Invoices per month", "Basic AI-filling assistant", "Standard PDF exports", "Secure cloud storage"],
                cta: "Get Started",
                popular: false
              },
              {
                name: "Professional",
                price: "999",
                description: "For growing makers & agencies",
                features: ["Unlimited invoices", "Advanced AI context parsing", "Custom brand matching", "Direct professional emailing", "Priority support"],
                cta: "Go Pro",
                popular: true
              },
              {
                name: "Business",
                price: "1499",
                description: "Full suite for large operations",
                features: ["Everything in Professional", "Team collaboration (3 users)", "API & Webhook access", "Multi-currency intelligence", "Dedicated account manager"],
                cta: "Scale Now",
                popular: false
              }
            ].map((plan, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-[32px] border ${
                  plan.popular ? 'border-neutral-900 shadow-2xl shadow-neutral-200' : 'border-neutral-100 bg-neutral-50/50'
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-xs text-neutral-500 font-medium mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif font-medium">₹{plan.price}</span>
                    <span className="text-neutral-400 text-sm">/mo</span>
                  </div>
                </div>
                <div className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-emerald-600' : 'text-neutral-300'}`} />
                      <span className="text-sm text-neutral-600">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link 
                  to="/login"
                  className={`w-full py-4 rounded-2xl text-center text-sm font-bold transition-all ${
                    plan.popular 
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg' 
                      : 'bg-white border border-neutral-200 text-neutral-900 hover:border-neutral-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 px-6 border-t border-neutral-100 bg-white">
        <div className="max-w-3xl mx-auto text-center border border-neutral-100 rounded-[48px] p-20 shadow-neutral-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="w-12 h-12 text-neutral-50" />
          </div>
          <h2 className="text-5xl font-serif font-medium tracking-tighter mb-8 leading-tight">Focus on the work,<br />not the paperwork.</h2>
          <p className="text-lg text-neutral-500 mb-10 leading-relaxed px-10">
            Join thousands of professionals who have simplified their billing workflow with BillaraAI.
          </p>
          <Link 
            to="/login" 
            className="inline-flex px-10 py-5 bg-neutral-900 text-white font-bold rounded-2xl items-center gap-4 hover:bg-neutral-800 transition-all active:scale-[0.95] shadow-xl shadow-neutral-200"
          >
            Create Your First Invoice
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-10 text-neutral-400 text-sm font-medium">Free forever plan available. No credit card required.</p>
        </div>
      </footer>
    </div>
  );
}
