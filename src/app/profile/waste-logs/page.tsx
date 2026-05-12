'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import { WasteAnalytics } from '@/types';
import { motion } from 'motion/react';
import { Trash2, AlertCircle, TrendingDown, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

export default function WasteLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<WasteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    try {
      const data = await supabaseService.getWasteLogs(user!.id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading waste logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLoss = logs.reduce((acc, log) => acc + log.estimated_loss, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/profile" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Waste Analytics & Loss Logs</h1>
          <p className="text-slate-500 text-sm">Tracking inventory lifecycles to improve farm efficiency.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-2 text-red-600">
            <TrendingDown size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Total Estimated Loss</span>
          </div>
          <p className="text-3xl font-black text-red-700 dark:text-red-400">{totalLoss.toLocaleString()} CFA</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <Trash2 size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Items Archived</span>
          </div>
          <p className="text-3xl font-black">{logs.length}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-2 text-amber-600">
            <AlertCircle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Primary Reason</span>
          </div>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-400">Expiration</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-white/5">
          <h2 className="text-xl font-black tracking-tight">Inventory Cleanup History</h2>
          <p className="text-xs text-slate-500 mt-1">Automatic records of products reaching their shelf-life limit.</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-500/5 rounded-full flex items-center justify-center mx-auto text-green-600">
                <Trash2 size={32} />
              </div>
              <p className="text-slate-500 italic">No waste logs detected. Your inventory management is perfect!</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-4">Produce</th>
                  <th className="px-8 py-4">Qty Wasted</th>
                  <th className="px-8 py-4">Valuation Loss</th>
                  <th className="px-8 py-4">Archived On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6 font-bold">{log.product_name}</td>
                    <td className="px-8 py-6 text-sm">
                      <span className="font-black">{log.quantity_wasted}</span>
                      <span className="text-slate-400 ml-1 text-xs">units</span>
                    </td>
                    <td className="px-8 py-6 text-red-600 font-black">-{log.estimated_loss.toLocaleString()} CFA</td>
                    <td className="px-8 py-6 text-xs text-slate-500 flex items-center gap-2">
                      <Clock size={14} />
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
