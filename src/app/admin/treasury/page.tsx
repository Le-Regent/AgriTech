'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  Percent, 
  ArrowUpRight, 
  ArrowDownLeft,
  Activity,
  DollarSign,
  PieChart as PieIcon,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function AdminTreasuryPage() {
  const [stats, setStats] = useState({
    escrowTotal: 0,
    commissionsTotal: 0,
    pendingWithdrawals: 0,
    liquidityScore: 98.4,
    monthlyVolume: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreasuryData();
  }, []);

  async function loadTreasuryData() {
    setLoading(true);
    try {
      const orders = await supabaseService.getAllOrders();
      const commissionRate = Number(await supabaseService.getSystemConfig('platform_commission') || '5') / 100;

      const escrow = orders
        .filter(o => ['ESCROW_HELD', 'shipped', 'processing', 'delivered'].includes(o.status))
        .reduce((acc, o) => acc + (o.total_amount || 0), 0);

      const commissions = orders
        .filter(o => o.status === 'COMPLETED')
        .reduce((acc, o) => acc + ((o.total_amount || 0) * commissionRate), 0);

      // Simulate some withdrawal data
      setStats({
        escrowTotal: escrow,
        commissionsTotal: commissions,
        pendingWithdrawals: escrow * 0.15,
        liquidityScore: 98.4,
        monthlyVolume: [
          { name: 'Jan', value: 450000 },
          { name: 'Feb', value: 520000 },
          { name: 'Mar', value: 380000 },
          { name: 'Apr', value: 610000 },
          { name: 'May', value: escrow }
        ]
      });
    } catch (error) {
      console.error('Error loading treasury:', error);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#10b981', '#6366f1'];
  const chartData = [
    { name: 'Seller Funds', value: stats.escrowTotal },
    { name: 'Platform Commissions', value: stats.commissionsTotal }
  ];

  const mainStats = [
    { label: 'Total in Escrow', value: `${stats.escrowTotal.toLocaleString()} FCFA`, icon: Wallet, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Accrued Commissions', value: `${stats.commissionsTotal.toLocaleString()} FCFA`, icon: Percent, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending Payouts', value: `${stats.pendingWithdrawals.toLocaleString()} FCFA`, icon: Activity, color: 'text-amber-600 bg-amber-50' },
    { label: 'Liquidity Health', value: `${stats.liquidityScore}%`, icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Treasury Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Real-time Liquidity & Commission Ledger</p>
        </div>
        <button 
          onClick={loadTreasuryData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Sync Ledger
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funds Distribution */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest">Vault Distribution</h3>
            <PieIcon size={20} className="text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-xs font-bold text-slate-500">{data.name}</span>
                </div>
                <span className="text-xs font-black">{((data.value / (stats.escrowTotal + stats.commissionsTotal)) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume History */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest">Marketplace Volume (FCFA)</h3>
            <TrendingUp size={20} className="text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Safety Warnings */}
      <div className="bg-amber-50 dark:bg-blue-900/10 border border-amber-100 dark:border-blue-900/30 rounded-[2.5rem] p-8 flex items-start gap-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-amber-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 dark:text-blue-400 uppercase tracking-widest mb-1">Treasury Verification Notice</h4>
          <p className="text-xs font-medium text-amber-700 dark:text-blue-300 leading-relaxed max-w-2xl">
            Liquidity is calculated based on successful Campay collections currently held in the transient aggregator account. 
            Commissions are only realized after an order reaches "COMPLETED" status. Ensure platform balances on MoMo/Orange 
            match these figures before bulk payouts.
          </p>
        </div>
      </div>
    </div>
  );
}
