'use client';

import React, { useEffect, useState } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Stats {
  users: number;
  orders: number;
  products: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadData = async (toastOnSuccess = false) => {
    try {
      if (toastOnSuccess) {
        setIsRefreshing(true);
      }
      const [s, orders] = await Promise.all([
        supabaseService.getAdminStats(),
        supabaseService.getAllOrders()
      ]);
      setStats(s);
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      if (toastOnSuccess) {
        setIsRefreshing(false);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', trend: '+5.2%', positive: true },
    { label: 'Total Orders', value: stats?.orders || 0, icon: ShoppingBag, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', trend: '+12.4%', positive: true },
    { label: 'Live Products', value: stats?.products || 0, icon: Activity, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', trend: '-2.1%', positive: false },
    { label: 'Total Revenue', value: stats ? `${stats.revenue.toLocaleString()} CFA` : 0, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', trend: '+8.7%', positive: true },
  ];

  const systemHealth = [
    { label: 'API Latency', value: '42ms', status: 'optimal' },
    { label: 'DB Load', value: '12%', status: 'optimal' },
    { label: 'Storage', value: '4.2GB / 50GB', status: 'warning' },
    { label: 'Uptime', value: '99.98%', status: 'optimal' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Command Center</h1>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Platform Intelligence & Global Operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer ${
              autoRefresh 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-amber-505 animate-ping' : 'bg-slate-400'}`} />
            {autoRefresh ? 'Auto Sync ON' : 'Auto Sync OFF'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-2 h-2 bg-green-505 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">System Live</span>
          </div>

          <button 
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-primary transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] block ${isRefreshing ? 'animate-spin text-primary' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                <div className="w-12 h-5 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
              </div>
              <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 rounded-full mb-2 animate-pulse" />
              <div className="w-32 h-8 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>
          ))
        ) : (
          statCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-primary/30 transition-all shadow-sm overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${card.color.split(' ')[0]}`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color} shadow-lg shadow-current/10`}>
                  <card.icon size={22} className="opacity-90" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${card.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.trend}
                </div>
              </div>
              
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{card.label}</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* System Health Ticker */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2.5rem] text-white shadow-2xl border border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">monitoring</span>
              System Telemetry
            </h2>
            <div className="space-y-6">
              {systemHealth.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/60">{item.label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'optimal' ? 'text-green-400' : 'text-amber-400'}`}>{item.value}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: item.status === 'optimal' ? '85%' : '35%' }}
                      className={`h-full ${item.status === 'optimal' ? 'bg-green-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-400">shield_check</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase">Security Verified</p>
                  <p className="text-[9px] text-white/40 italic">Last audit: Today, 04:22 AM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center justify-between">
              Live Feed
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            </h2>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 overflow-hidden flex-shrink-0">
                    <img src={`https://picsum.photos/seed/user${i*2}/32/32`} alt="User" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                      <span className="font-bold text-slate-900 dark:text-white">Admin {i+1}</span> updated profile verification
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">{i * 12}m ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-12 xl:col-span-9 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-w-0">
          <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Recent Activity</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">High Resolution Log of Platform Movement</p>
            </div>
            <button className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
              Export Archive
            </button>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <div className="min-w-[800px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="px-8 py-4">Transaction Identity</th>
                    <th className="px-8 py-4">Counterparty</th>
                    <th className="px-8 py-4">Status & Integrity</th>
                    <th className="px-8 py-4 text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />
                             <div className="space-y-2">
                               <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                               <div className="w-16 h-2 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                             <div className="space-y-2">
                               <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                               <div className="w-32 h-2 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="w-24 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="w-20 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                              <span className="material-symbols-outlined text-[20px]">assignment</span>
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden border border-slate-100 dark:border-white/10">
                              <img 
                                src={order.buyer?.avatar_url || `https://picsum.photos/seed/${order.buyer?.id}/32/32`} 
                                alt="Buyer" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{order.buyer?.full_name || 'Anonymous'}</p>
                              <p className="text-[10px] text-slate-400 truncate tracking-tight">{order.buyer?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-500' :
                              order.status === 'pending' ? 'bg-amber-500' : 'bg-primary'
                            }`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                              order.status === 'delivered' ? 'text-green-500' :
                              order.status === 'pending' ? 'text-amber-500' : 'text-primary'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{order.total_amount.toLocaleString()} CFA</p>
                          <p className="text-[9px] font-black uppercase text-green-500 tracking-widest">Verified Payment</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-white/[0.01] flex justify-center">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
              Operational Logs
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
