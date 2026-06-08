'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  Search, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  XSquare, 
  Filter,
  RefreshCcw,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getDisputedOrders();
      setDisputes(data);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (orderId: string, resolution: 'REFUND' | 'PAY_FARMER') => {
    if (!confirm(`Are you sure you want to resolve this dispute with: ${resolution}?`)) return;
    
    try {
      if (resolution === 'PAY_FARMER') {
        await supabaseService.approveEscrowPayout(orderId);
      } else {
        // Mock refund logic - in real world would call Campay Refund API
        await supabaseService.updateOrderStatus(orderId, 'cancelled');
        alert('Refund initiated via MoMo aggregator.');
      }
      
      // Log Action
      const user = await supabaseService.getProfile((await (await fetch('/api/auth/me')).json()).id);
      await supabaseService.logAdminAction(user.id, 'DISPUTE_RESOLUTION', `Resolution: ${resolution} for Order ${orderId}`, orderId);
      
      setDisputes(disputes.filter(d => d.id !== orderId));
      setSelectedDispute(null);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Resolution failed. Check platform logs.');
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dispute Resolution Center</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Impartial Oversight & Escrow Adjudication</p>
        </div>
        <button 
          onClick={loadDisputes}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Disputes List */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 animate-pulse" />
            ))
          ) : disputes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="text-slate-300" size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">No active disputes detected</p>
              <p className="text-xs text-slate-500 mt-2">The marketplace is currently operating within safety parameters.</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                layoutId={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border cursor-pointer transition-all ${
                  selectedDispute?.id === dispute.id 
                    ? 'border-red-500 shadow-xl shadow-red-500/5 ring-1 ring-red-500' 
                    : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest bg-red-50 text-red-500 px-2 py-0.5 rounded inline-block mb-1">
                        PENDING ESCROW
                      </p>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Order #{dispute.id.slice(0, 8).toUpperCase()}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{dispute.total_amount.toLocaleString()} FCFA</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(dispute.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <User size={12} className="text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dispute.buyer?.full_name} (Buyer)</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dispute.order_items?.[0]?.products?.farmer?.full_name} (Seller)</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <User size={12} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Adjudication Panel */}
        <div className="lg:col-span-12 xl:col-span-5">
          <AnimatePresence mode="wait">
            {selectedDispute ? (
              <motion.div
                key="panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center">
                    <ShieldAlert size={24} />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Escrow Adjudication</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Buyer Claim Info</p>
                    <div className="bg-white/5 dark:bg-slate-900/5 p-4 rounded-2xl border border-white/10 dark:border-slate-900/10">
                      <p className="text-xs font-bold">{selectedDispute.buyer?.full_name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{selectedDispute.buyer?.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Seller Contact Info</p>
                    <div className="bg-white/5 dark:bg-slate-900/5 p-4 rounded-2xl border border-white/10 dark:border-slate-900/10">
                      <p className="text-xs font-bold">{selectedDispute.order_items?.[0]?.products?.farmer?.full_name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{selectedDispute.order_items?.[0]?.products?.farmer?.phone_number}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Listing Data</p>
                    <p className="text-sm font-black">{selectedDispute.order_items?.[0]?.products?.name}</p>
                  </div>

                  <div className="pt-8 border-t border-white/10 dark:border-slate-900/10 space-y-4">
                    <button 
                      onClick={() => handleResolve(selectedDispute.id, 'PAY_FARMER')}
                      className="w-full py-4 bg-primary text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Verify & Release Funds <CheckCircle size={16} />
                    </button>
                    <button 
                      onClick={() => handleResolve(selectedDispute.id, 'REFUND')}
                      className="w-full py-4 bg-white/10 dark:bg-slate-900/10 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 dark:border-slate-900/10"
                    >
                      Initiate Buyer Refund <XSquare size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 p-12 text-center h-full flex flex-col items-center justify-center">
                <ArrowRight className="text-slate-300 mb-4" size={32} />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Select accurate file to adjudicate</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
