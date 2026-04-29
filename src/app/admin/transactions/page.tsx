'use client';

import React, { useEffect, useState } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock,
  MoreVertical
} from 'lucide-react';

export default function TransactionsManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await supabaseService.getAllOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 size={12} className="mr-1" />;
      case 'shipped': return <Truck size={12} className="mr-1" />;
      case 'processing': return <Package size={12} className="mr-1" />;
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and track all platform transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            <Download size={18} />
            Export CSV
          </button>
          <button className="p-2 bg-slate-900 dark:bg-green-600 text-white rounded-xl hover:opacity-90 transition-opacity">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer ${expandedOrder === order.id ? 'bg-slate-50 dark:bg-slate-900/30' : ''}`}
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <td className="px-6 py-4">
                      {expandedOrder === order.id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mr-2">
                          <img src={order.buyer?.avatar_url || `https://picsum.photos/seed/${order.buyer?.id}/32/32`} alt="Avatar" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{order.buyer?.full_name}</p>
                          <p className="text-[10px] text-slate-500">{order.buyer?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                  
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50/50 dark:bg-slate-900/10"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Items Purchased</h4>
                              <div className="space-y-3">
                                {order.order_items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Package size={20} className="text-slate-400" />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold dark:text-white">{item.products?.name}</p>
                                        <p className="text-[10px] text-slate-500">By {item.products?.farmer?.full_name}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-bold dark:text-white">${item.price_at_purchase} x {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Shipping Information</h4>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                  {order.shipping_address || 'Standard Pickup from Cameroon Regional Terminal'}
                                </p>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                                  Update Status
                                </button>
                                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                                  View Invoice
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
