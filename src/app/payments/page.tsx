'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { downloadInvoicePDF } from '@/lib/payments/invoiceGenerator';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Receipt, Download, CreditCard, Clock, CheckCircle2, AlertTriangle, ArrowLeft, PiggyBank, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function WalletHistoryPage() {
  const { user } = useUser();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await supabaseService.getUserPayments(user.id, user.user_type || 'buyer');
      setPayments(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const handleDownloadInvoice = async (payment: any) => {
    const orderData = payment.orders || {
      id: payment.order_id,
      total_amount: payment.amount,
      created_at: payment.created_at,
      status: payment.status === 'escrow_held' ? 'escrow_held' : payment.status,
      shipping_address: payment.shipping_address || 'Direct handover'
    };

    try {
      toast.info('Drafting PDF receipt...');
      await downloadInvoicePDF(orderData, user?.full_name || 'KamerFresh User');
      toast.success('Receipt downloaded successfully!');
    } catch (err) {
      toast.error('Error generating receipt.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'success':
      case 'successful':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 capitalize">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'escrow_held':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
            <PiggyBank size={12} />
            Escrow Held
          </span>
        );
      case 'refunded':
      case 'refund_completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 capitalize">
            <RefreshCw size={12} />
            Refunded
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400 capitalize animate-pulse">
            <Clock size={12} />
            Pending Check
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-105 text-rose-800 dark:bg-rose-900/30 dark:text-rose-450 capitalize">
            <AlertTriangle size={12} />
            {status}
          </span>
        );
    }
  };

  // Compute stats metrics
  const totalSpent = payments
    .filter(p => !['failed', 'cancelled', 'refunded'].includes(p.status?.toLowerCase()))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const holdCount = payments.filter(p => p.status?.toLowerCase() === 'escrow_held').length;

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 min-h-screen">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/marketplace" 
              className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary hover:underline tracking-widest mb-2"
            >
              <ArrowLeft size={14} />
              Back to Store
            </Link>
            <h1 className="text-3xl font-black uppercase italic dark:text-white tracking-tight">Wallet & payments</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review your Cameroonian Escrow balances, mobile pay logs, and download receipts.</p>
          </div>
          
          <button 
            onClick={fetchPayments}
            className="self-start sm:self-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Wallet
          </button>
        </div>

        {/* Stats Metrics Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/15">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Platform Activity Total</span>
              <CreditCard size={18} />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black">{totalSpent.toLocaleString()} FCFA</h3>
              <p className="text-[11px] opacity-80 mt-1">Successful or active Escrow orders</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escrow Safeguards</span>
              <PiggyBank size={18} className="text-primary" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-primary">{holdCount} Payments</h3>
              <p className="text-[11px] text-slate-400 mt-1">Secured safely until handover handshakes</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-6 rounded-3xl text-slate-900 dark:text-white shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type Class</span>
              <Receipt size={18} className="text-slate-400" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-indigo-600 dark:text-indigo-400">{user?.user_type || 'buyer'} Mode</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Status linked to Campay merchant checkout</p>
            </div>
          </div>
        </div>

        {/* Payments Table / List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-md font-black uppercase tracking-wider dark:text-white">Transaction Logs Ledger</h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-md">
              {payments.length} total events
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
                    <div className="space-y-2 flex-1 sm:flex-none">
                      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-28" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-16" />
                </div>
              ))}
            </div>
          ) : payments.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {payments.map((p) => {
                const invoiceDate = p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A';
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={p.id} 
                    className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black dark:text-white uppercase tracking-tight">
                            ORD-{p.order_id?.substring(0, 8).toUpperCase() || 'EXTERNAL'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            Ref: {p.campay_id || p.stripe_payment_id || 'Direct'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Authorized on: {invoiceDate} • Method: <span className="font-bold uppercase text-slate-650 dark:text-slate-300">{p.method || 'mobile-money'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                      <div className="text-left md:text-right space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {Number(p.amount).toLocaleString()} FCFA
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Escrowed Charge</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(p.status)}

                        <button
                          onClick={() => handleDownloadInvoice(p)}
                          title="Download receipt document"
                          aria-label="Download receipt document"
                          className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all text-slate-650 dark:text-slate-300"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 space-y-4">
              <Receipt size={48} className="mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="font-bold dark:text-white">No payouts or payments found.</p>
                <p className="text-xs">Once you process or place orders on KamerFresh, payments logs will appear in this ledger.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
