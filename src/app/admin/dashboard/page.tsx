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
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, orders] = await Promise.all([
          supabaseService.getAdminStats(),
          supabaseService.getAllOrders()
        ]);
        setStats(s);
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total Orders', value: stats?.orders || 0, icon: ShoppingBag, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Live Products', value: stats?.products || 0, icon: Activity, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Total Revenue', value: stats ? `$${stats.revenue.toLocaleString()}` : 0, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Platform overview and real-time statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
              <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                <ArrowUpRight size={14} className="mr-1" />
                12%
              </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
            <button className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Buyer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-300">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img 
                          src={order.buyer?.avatar_url || `https://picsum.photos/seed/${order.buyer?.id}/32/32`} 
                          alt="Buyer" 
                          className="w-8 h-8 rounded-full mr-3 border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{order.buyer?.full_name || 'Incognito User'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{order.buyer?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">${order.total_amount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Activity Ticker */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Live Activity</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/40/40`} alt="User" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900 dark:text-white">
                    <span className="font-bold">User {i}</span> listed a new batch of Rice
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {i * 10}m ago
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            See All Logs
          </button>
        </div>
      </div>
    </div>
  );
}
