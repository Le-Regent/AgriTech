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
import dynamic from 'next/dynamic';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';

const ListingCharts = dynamic(() => import('./ListingCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      <div className="h-[400px] bg-slate-100 dark:bg-muted-dark rounded-[2.5rem]" />
      <div className="h-[400px] bg-slate-100 dark:bg-muted-dark rounded-[2.5rem]" />
    </div>
  )
});

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
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-muted-dark" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-100 dark:bg-muted-dark rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-muted-dark rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white dark:bg-muted-dark border border-slate-100 dark:border-border-dark rounded-[2rem] animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-muted-dark border border-slate-100 dark:border-border-dark rounded-[2.5rem] animate-pulse" />
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
              className="w-10 h-10 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="text-3xl font-black tracking-tight dark:text-white">{product.name}</h2>
              <p className="text-slate-500 dark:text-slate-400">Sales Performance & Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm">
            <Package size={18} />
            {product.stock_quantity} {formatUnit(product.unit)} Left
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Sold</p>
            <h3 className="text-3xl font-black dark:text-white">
              {stats.totalSold} <span className="text-sm font-medium text-slate-500">{formatUnit(product.unit)}</span>
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Revenue</p>
            <h3 className="text-3xl font-black text-primary">
              {stats.totalRevenue.toLocaleString()} <span className="text-sm font-medium">FCFA</span>
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Orders</p>
            <h3 className="text-3xl font-black dark:text-white">{stats.orderCount}</h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Avg. Order Size</p>
            <h3 className="text-3xl font-black dark:text-white">
              {stats.orderCount > 0 ? (stats.totalSold / stats.orderCount).toFixed(1) : 0}
              <span className="text-sm font-medium text-slate-500"> {formatUnit(product.unit)}</span>
            </h3>
          </div>
        </div>

        {/* Charts - Dynamic */}
        <ListingCharts chartData={stats.chartData} />

        {/* Recent Sales Table */}
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-border-dark">
            <h3 className="text-lg font-black dark:text-white">Recent Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-muted-dark/50">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Buyer</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Quantity</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                {sales.length > 0 ? sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-surface-hover-dark transition-colors">
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
