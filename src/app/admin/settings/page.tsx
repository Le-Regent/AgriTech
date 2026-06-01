'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion } from 'motion/react';
import { 
  Settings, 
  ShieldCheck, 
  Percent, 
  Smartphone, 
  Lock, 
  Save, 
  AlertTriangle,
  RefreshCcw,
  Zap,
  Globe,
  Bell
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({
    'platform_commission': '5',
    'min_withdrawal': '1000',
    'support_whatsapp': '+237000000000',
    'maintenance_mode': 'false',
    'admin_protocol_password': '****',
    'feature_logistics': 'true',
    'feature_crop_doctor': 'true',
    'payment_sandbox': 'true'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const keys = Object.keys(configs);
      const newConfigs = { ...configs };
      await Promise.all(keys.map(async key => {
        const val = await supabaseService.getSystemConfig(key);
        if (val !== null) newConfigs[key] = val;
      }));
      setConfigs(newConfigs);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string) => {
    setSaving(key);
    setSuccess(null);
    try {
      await supabaseService.updateSystemConfig(key, configs[key]);
      setSuccess(key);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update system configuration.');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const configGroups = [
    {
      title: 'Financial Parameters',
      icon: Percent,
      items: [
        { key: 'platform_commission', label: 'Platform Commission (%)', helper: 'Percentage taken from farmer payouts for infrastructure costs.', type: 'number' },
        { key: 'min_withdrawal', label: 'Minimum Withdrawal (CFA)', helper: 'Smallest amount a farmer can withdraw to MoMo.', type: 'number' },
        { key: 'payment_sandbox', label: 'Payment Sandbox Simulation', helper: 'Forces virtual MoMo payments allowing you to test checkouts & payouts seamlessly without live money or merchant keys.', type: 'select', options: ['true', 'false'] },
      ]
    },
    {
      title: 'Support & Connectivity',
      icon: Smartphone,
      items: [
        { key: 'support_whatsapp', label: 'Official Support WhatsApp', helper: 'Phone number used for "Contact Admin" triggers.', type: 'text' },
      ]
    },
    {
      title: 'Security & Access',
      icon: ShieldCheck,
      items: [
        { key: 'admin_protocol_password', label: 'Master Protocol Password', helper: 'Overrides standard auth in emergency situations.', type: 'password' },
        { key: 'maintenance_mode', label: 'Global Maintenance Mode', helper: 'If "true", blocks non-admin access to the app.', type: 'select', options: ['true', 'false'] },
      ]
    },
    {
      title: 'Feature Flags',
      icon: Zap,
      items: [
        { key: 'feature_logistics', label: 'Logistics Engine', helper: 'Enable/Disable the MoMo Transport modules.', type: 'select', options: ['true', 'false'] },
        { key: 'feature_crop_doctor', label: 'Crop Doctor AI', helper: 'Enable/Disable the Plant Pathology scanner.', type: 'select', options: ['true', 'false'] },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Configuration</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Global Variables & Environment DNA</p>
        </div>
        <button 
          onClick={loadAllConfigs}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Sync State
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {configGroups.map((group, gIdx) => (
          <motion.div
            key={gIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gIdx * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <group.icon size={20} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">{group.title}</h2>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {group.items.map((item) => (
                <div key={item.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                        {item.label}
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 pr-8">{item.helper}</p>
                    </div>
                    {success === item.key && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
                         <Zap size={10} className="fill-current" /> Propagated
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {item.type === 'select' ? (
                      <select 
                        value={configs[item.key]}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                      >
                        {item.options?.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={item.type}
                        value={configs[item.key]}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                    <button 
                      onClick={() => handleUpdate(item.key)}
                      disabled={saving === item.key}
                      className="px-4 bg-slate-900 dark:bg-green-600 text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
                      title="Save Changes"
                    >
                      {saving === item.key ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Emergency Deny-All Footer */}
      <div className="mt-12 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[2.5rem] p-8 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-red-600 tracking-tight">Protocol Red Alert</h3>
          <p className="text-sm text-red-500/80 mt-1">Adjusting security settings (Maintenance Mode or Master Passwords) will propagate across all nodes instantly. Be absolutely certain before committing.</p>
        </div>
      </div>
    </div>
  );
}
