'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { toast } from 'sonner';

const FEATURES = [
  {
    title: 'AI Crop Diagnosis',
    description: 'Unlimited scans and advanced treatment recommendations for over 50+ crop types.',
    icon: 'biotech',
    color: 'bg-green-500'
  },
  {
    title: 'Market Intelligence',
    description: 'Real-time price tracking from all major local markets with 30-day price forecasting.',
    icon: 'query_stats',
    color: 'bg-blue-500'
  },
  {
    title: 'Priority Marketplace',
    description: 'Your products appear at the top of search results and are featured on the home page.',
    icon: 'star',
    color: 'bg-amber-500'
  },
  {
    title: 'Logistics Shield',
    description: 'Priority booking for refrigerated transport and discounted delivery rates.',
    icon: 'local_shipping',
    color: 'bg-slate-800'
  }
];

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '0',
    description: 'Perfect for small household gardens',
    features: ['Basic Marketplace Access', '5 Crop Diagnosis / month', 'Standard Support'],
    buttonText: 'Current Plan',
    current: true
  },
  {
    id: 'pro',
    name: 'Farmer Pro',
    price: '4,900',
    description: 'For commercial farms and serious growers',
    features: [
      'Unlimited AI Diagnosis',
      'Advanced Market Insights',
      'Priority Listing Badge',
      'Waste Analytics Dashboard',
      '24/7 Premium Support'
    ],
    buttonText: 'Upgrade Now',
    highlight: true
  }
];

export default function ProPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const router = useRouter();

  const handleUpgrade = () => {
    toast.success("Redirecting to secure checkout...");
    // Future integration: router.push('/checkout/pro');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] -left-[5%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Premium Agriculture
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Empower Your Farm with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">Farmer Pro</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium">
              Join the elite league of farmers using AI-driven insights, priority logistics, and advanced market data to maximize yield and profit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className={`relative bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02] ${
                plan.highlight 
                  ? 'border-emerald-500/50 dark:border-emerald-500/30' 
                  : 'border-white dark:border-slate-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">XAF</span>
                  <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ Month</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex gap-3 items-center group">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      plan.highlight ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={plan.current}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${
                  plan.current
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center mb-20">
          <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Deep Dive</h2>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Everything you need to scale</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group"
            >
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-3">{feature.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Suggestion or Trust Badge */}
      <section className="bg-emerald-950 py-24 px-4 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 blur-[200px] rounded-full" />
         </div>
         
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight italic">
              "Since upgrading to Pro, our logistics overhead dropped by 25% and my profit-per-hectare increased significantly."
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-1">
                 <ResponsiveImage 
                    src="https://picsum.photos/seed/farmer1/100/100" 
                    alt="Success Story" 
                    className="w-full h-full rounded-full object-cover"
                    baseWidth={100}
                    baseHeight={100}
                 />
              </div>
              <p className="text-emerald-400 font-black uppercase tracking-widest text-xs">Moussa Ibrahim — West Region Corn Farmer</p>
            </div>
         </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-900 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Secure Payments Powered by KamerFresh and MTN MoMo</p>
         <button 
          onClick={() => router.push('/')}
          className="text-slate-600 dark:text-slate-400 text-xs font-bold hover:text-primary transition-colors underline underline-offset-4"
         >
           Back to Dashboard
         </button>
      </footer>
    </div>
  );
}
