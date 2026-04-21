'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { supabaseService } from '@/services/supabaseService';
import { Product, OrderItem, Order } from '@/types';
import { useUser } from '@/context/UserContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { formatUnit } from '@/lib/unitUtils';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function ProductInsightsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [productData, salesData] = await Promise.all([
          supabaseService.getProductById(id),
          supabaseService.getProductSales(id)
        ]);
        setProduct(productData as Product);
        setSales(salesData);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    const totalSold = sales.reduce((acc, sale) => acc + (sale.quantity || 0), 0);
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.quantity * sale.price_at_purchase), 0);
    const orderCount = sales.length;
    
    // Group sales by date for chart
    const salesByDate = sales.reduce((acc: any, sale) => {
      const date = format(new Date(sale.orders.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, quantity: 0, revenue: 0 };
      }
      acc[date].quantity += sale.quantity;
      acc[date].revenue += sale.quantity * sale.price_at_purchase;
      return acc;
    }, {});

    const chartData = Object.values(salesByDate).reverse();

    return { totalSold, totalRevenue, orderCount, chartData };
  }, [sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold dark:text-white">Product not found</h2>
        <Link href="/listings" className="text-primary hover:underline mt-4 inline-block">Back to Listings</Link>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/listings"
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-3xl font-black tracking-tight dark:text-white">{product.name}</h2>
              <p className="text-slate-500 dark:text-slate-400">Sales Performance & Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            {product.stock_quantity} {formatUnit(product.unit)} Left
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Sold</p>
            <h3 className="text-3xl font-black dark:text-white">
              {stats.totalSold} <span className="text-sm font-medium text-slate-500">{formatUnit(product.unit)}</span>
            </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Revenue</p>
            <h3 className="text-3xl font-black text-primary">
              {stats.totalRevenue.toLocaleString()} <span className="text-sm font-medium">FCFA</span>
            </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Orders</p>
            <h3 className="text-3xl font-black dark:text-white">{stats.orderCount}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Avg. Order Size</p>
            <h3 className="text-3xl font-black dark:text-white">
              {stats.orderCount > 0 ? (stats.totalSold / stats.orderCount).toFixed(1) : 0}
              <span className="text-sm font-medium text-slate-500"> {formatUnit(product.unit)}</span>
            </h3>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black mb-6 dark:text-white">Sales Volume</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black mb-6 dark:text-white">Revenue Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black dark:text-white">Recent Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Buyer</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Quantity</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.length > 0 ? sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 text-sm dark:text-white">
                      {format(new Date(sale.orders.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold dark:text-white">{sale.orders.profiles?.full_name || 'Anonymous'}</span>
                        <span className="text-xs text-slate-500">{sale.orders.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm font-bold dark:text-white">
                      {sale.quantity} {formatUnit(product.unit)}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-primary">
                      {(sale.quantity * sale.price_at_purchase).toLocaleString()} FCFA
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        sale.orders.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        sale.orders.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {sale.orders.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                      No sales recorded for this product yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
