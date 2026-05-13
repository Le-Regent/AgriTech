'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useUser } from '@/context/UserContext';
import { useOffline } from '@/context/OfflineContext';
import { supabaseService } from '@/services/supabaseService';
import { Product, Order } from '@/types';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function InsightsContent() {
  const { user } = useUser();
  const { isOnline, getFromCache, saveToCache } = useOffline();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const cacheKey = `farmer_insights_data_${user.id}`;
      const cached = await getFromCache(cacheKey);
      if (cached) {
        setProducts(cached.products);
        setOrders(cached.orders);
        setWasteLogs(cached.wasteLogs || []);
        setLoading(false);
      }

      try {
        if (isOnline) {
          const [productsData, ordersData, wasteData] = await Promise.all([
            supabaseService.getProductsByFarmerId(user.id),
            supabaseService.getOrders(user.id, 'farmer'),
            supabaseService.getWasteLogs(user.id)
          ]);
          
          setProducts(productsData || []);
          setOrders(ordersData || []);
          setWasteLogs(wasteData || []);
          saveToCache(cacheKey, { 
            products: productsData, 
            orders: ordersData, 
            wasteLogs: wasteData 
          });
        }
      } catch (error) {
        console.error('Failed to fetch insights data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isOnline, getFromCache, saveToCache]);

  const salesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(month => ({ name: month, revenue: Math.floor(Math.random() * 500000) + 100000 }));
    // In a real app, we would aggregate actual orders by month
    return data;
  }, []);

  const productPerformance = useMemo(() => {
    return products.slice(0, 5).map(p => ({
      name: p.name,
      value: Math.floor(Math.random() * 50) + 10
    }));
  }, [products]);

  const wasteByReason = useMemo(() => {
    const reasons: Record<string, number> = {};
    wasteLogs.forEach(log => {
      reasons[log.reason] = (reasons[log.reason] || 0) + Number(log.estimated_loss);
    });
    return Object.entries(reasons).map(([name, value]) => ({ name, value }));
  }, [wasteLogs]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
  const WASTE_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#64748b'];

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Generating AI Insights...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight dark:text-white">Commercial Insights</h2>
          <p className="text-slate-500 dark:text-muted-dark">AI-driven analytics to maximize your farm&apos;s profitability.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            <span className="text-xs font-bold dark:text-white">Last 30 Days</span>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '2.4M CFA', change: '+12%', icon: 'payments', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Waste Loss', value: `${wasteLogs.reduce((acc, log) => acc + Number(log.estimated_loss), 0).toLocaleString()} CFA`, change: 'Loss', icon: 'delete_sweep', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Orders', value: orders.length.toString(), change: '+5%', icon: 'shopping_bag', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Market Demand', value: 'High', change: 'Trending', icon: 'trending_up', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm group hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-black text-slate-400 dark:text-muted-dark uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black dark:text-white">{stat.value}</h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black dark:text-white">Revenue Growth</h3>
              <p className="text-xs text-slate-500 font-medium">Projected monthly earnings performance</p>
            </div>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  fontWeight={900}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '900'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  name="Revenue (CFA)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black dark:text-white">Product Demand</h3>
              <p className="text-xs text-slate-500 font-medium">Conversion rate across top listings</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">pie_chart</span>
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {productPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-200">monitoring</span>
                <p className="text-xs text-slate-400 font-bold font-mono">No product data available for comparison</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black dark:text-white">Waste Analytics</h3>
              <p className="text-xs text-slate-500 font-medium">Estimated loss by waste reason</p>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">delete_sweep</span>
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {wasteByReason.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteByReason}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {wasteByReason.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={WASTE_COLORS[index % WASTE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value ? `${value.toLocaleString()} CFA` : '0 CFA'} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-200">auto_delete</span>
                <p className="text-xs text-slate-400 font-bold font-mono">No waste data reported yet</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm">
          <h3 className="text-xl font-black mb-6 dark:text-white">Market Intelligence</h3>
          <div className="space-y-6">
            {[
              { label: 'Demand Surge: Organic Tomatoes', confidence: 'High', area: 'Littoral Region', action: 'Increase Stock' },
              { label: 'Price Optimization: Yam', confidence: 'Medium', area: 'South West', action: 'Wait to Sell' },
              { label: 'Logistics Opportunity', confidence: 'High', area: 'Douala Hub', action: 'Consolidate Shipments' },
            ].map((insight, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-muted-dark rounded-3xl border border-slate-100 dark:border-border-dark gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <h5 className="text-sm font-black dark:text-white uppercase tracking-wide">{insight.label}</h5>
                  </div>
                  <p className="text-xs text-slate-500 font-bold ml-4">{insight.area}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${insight.confidence === 'High' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {insight.confidence} Confidence
                  </span>
                  <button className="bg-white dark:bg-surface-dark text-slate-900 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black border border-slate-200 dark:border-border-dark hover:bg-slate-50 transition-colors uppercase tracking-widest">
                    {insight.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary to-emerald-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="text-2xl font-black leading-tight">AI Farm Manager</h3>
              <p className="text-white/80 text-sm font-bold leading-relaxed">
                Based on current trends, we recommend listing your <span className="text-white font-black">White Onions</span> in the <span className="text-white font-black">Centre Region</span> to capitalize on a 15% price surge predicted for next week.
              </p>
            </div>
            <button className="bg-white text-primary w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-8 hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
              Apply Recommendation
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <InsightsContent />
    </ProtectedRoute>
  );
}
