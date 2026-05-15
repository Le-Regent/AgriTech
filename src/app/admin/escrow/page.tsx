'use client';

import React, { useEffect, useState } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  History,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function AdminEscrowPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await supabaseService.getAllOrders();
      // Filter for orders that are pending, ESCROW_HELD, shipped, or delivered (handshake done)
      // but especially those ready for final payout (delivered)
      setOrders(allOrders.filter(o => 
        ['pending', 'ESCROW_HELD', 'processing', 'shipped', 'delivered', 'COMPLETED'].includes(o.status)
      ));
    } catch (error) {
      console.error('Error loading escrow orders:', error);
      toast.error('Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await supabaseService.approveEscrowPayout(orderId);
      toast.success('Payout triggered successfully!');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Payout failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingPayouts = orders.filter(o => o.status === 'delivered');
  const inEscrow = orders.filter(o => ['pending', 'ESCROW_HELD', 'processing', 'shipped'].includes(o.status));
  const completed = orders.filter(o => o.status === 'COMPLETED');

  const stats = [
    { label: 'Active Escrow', count: inEscrow.length, icon: Wallet, color: 'text-amber-600 bg-amber-50' },
    { label: 'Ready for Payout', count: pendingPayouts.length, icon: FileCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Completed Today', count: completed.length, icon: History, color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Safe Pay Hub</h1>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Trust Management & Farmer Disbursements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Table: Ready for Payout */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-white/5 bg-green-50/30 dark:bg-green-500/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600">verified</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ready for Farmer Payout</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Buyer has provided OTP. Handshake confirmed. Funds release authorized.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-4">Order Entity</th>
                <th className="px-8 py-4">Farmer Details</th>
                <th className="px-8 py-4">Amount (95%)</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {pendingPayouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm italic">
                    No orders currently waiting for disbursement.
                  </td>
                </tr>
              ) : (
                pendingPayouts.map((order) => {
                  const farmer = order.order_items?.[0]?.products?.farmer;
                  const payoutAmount = order.total_amount * 0.95;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                      <td className="px-8 py-6">
                        <p className="text-xs font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                            {farmer?.full_name?.charAt(0) || 'F'}
                          </div>
                          <span className="text-xs font-bold">{farmer?.full_name || 'Farmer'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-green-600">{payoutAmount.toLocaleString()} CFA</p>
                        <p className="text-[9px] text-slate-400">Total: {order.total_amount.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleApprovePayout(order.id)}
                          disabled={processingId === order.id}
                          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                        >
                          {processingId === order.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">send_money</span>
                          )}
                          Disburse Funds
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Table: In Escrow / Transit */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden opacity-80">
        <div className="p-8 border-b border-slate-50 dark:border-white/5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Active Escrow Sessions</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Funds currently locked in platform wallet. Awaiting delivery confirmation.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-4">Transaction</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Evidence</th>
                <th className="px-8 py-4 text-right">Secured Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {inEscrow.map((order) => (
                <tr key={order.id}>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      order.status === 'pending' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                      order.status === 'ESCROW_HELD' ? 'bg-amber-100 text-amber-600' : 
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' : 
                      order.status === 'processing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {order.evidence_url ? (
                      <a href={order.evidence_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary underline">View Waybill</a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Upload Yet</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-xs font-black">{order.total_amount.toLocaleString()} CFA</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
