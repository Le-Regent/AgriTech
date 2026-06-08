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
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'ESCROW_HELD': return 'bg-primary/10 text-primary dark:bg-primary/20';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'COMPLETED': return 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 size={12} className="mr-1" />;
      case 'shipped': return <Truck size={12} className="mr-1" />;
      case 'processing': return <Package size={12} className="mr-1" />;
      case 'pending': 
      case 'ESCROW_HELD': return <Clock size={12} className="mr-1" />;
      case 'COMPLETED': return <CheckCircle2 size={12} className="mr-1" />;
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const totalOrders = orders.length;
  const completedVolume = orders.filter(o => o.status === 'delivered' || o.status === 'COMPLETED').length;
  const processingVolume = orders.filter(o => ['processing', 'pending', 'ESCROW_HELD', 'shipped'].includes(o.status)).length;
  const totalCFA = orders.reduce((acc, o) => acc + o.total_amount, 0);

  const marketStats = [
    { label: 'Total Volume', value: totalOrders, icon: Package, color: 'text-slate-600 bg-slate-100' },
    { label: 'Settled', value: completedVolume, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
    { label: 'In Transit', value: processingVolume, icon: Truck, color: 'text-blue-600 bg-blue-100' },
    { label: 'Aggregate', value: `${totalCFA.toLocaleString()} FCFA`, icon: Package, color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Ledger</h1>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Settlement & Logistics Terminal</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Export Protocol
          </button>
          <div className="relative group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-900 dark:bg-green-600 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none hover:opacity-90 shadow-lg"
            >
              <option value="all">Filter: All</option>
              <option value="pending">Pending</option>
              <option value="ESCROW_HELD">Escrow</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={14} className="text-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse mb-4" />
              <div className="w-16 h-2 bg-slate-100 dark:bg-white/5 rounded-full mb-2 animate-pulse" />
              <div className="w-24 h-6 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))
        ) : (
          marketStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <div className={`w-8 h-8 rounded-xl ${stat.color} dark:bg-opacity-20 flex items-center justify-center mb-4`}>
                <stat.icon size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5 w-10"></th>
                <th className="px-8 py-5">TX ID</th>
                <th className="px-8 py-5">Originator</th>
                <th className="px-8 py-5">Protocol State</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right">Value</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6"><div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" /></td>
                    <td className="px-8 py-6"><div className="w-16 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
                         <div className="space-y-2">
                           <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                           <div className="w-32 h-2 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                         </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="w-20 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-md" />
                    </td>
                    <td className="px-8 py-6">
                       <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="w-20 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full ml-auto" />
                    </td>
                    <td className="px-8 py-6"><div className="w-4 h-4 bg-slate-100 dark:bg-white/5 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer group ${expandedOrder === order.id ? 'bg-slate-50 dark:bg-white/[0.01]' : ''}`}
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <td className="px-8 py-6">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedOrder === order.id ? 'bg-primary text-white' : 'text-slate-400 group-hover:text-primary'}`}>
                          {expandedOrder === order.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-900 dark:text-white tracking-widest italic group-hover:text-primary transition-colors">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/10 shrink-0">
                            <img src={order.buyer?.avatar_url || `https://picsum.photos/seed/${order.buyer?.id}/36/36`} alt="Avatar" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{order.buyer?.full_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate">{order.buyer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3].map(i => (
                              <div key={i} className={`h-1 w-4 rounded-full ${
                                i === 1 ? 'bg-green-500' : 
                                (order.status === 'delivered' ? 'bg-green-500' : (order.status === 'shipped' && i <= 2 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-white/5'))
                              }`} />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="space-y-0.5">
                           <p className="text-[10px] font-black text-slate-900 dark:text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{order.total_amount.toLocaleString()} FCFA</p>
                      </td>
                      <td className="px-8 py-6 text-right text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </td>
                    </tr>
                  
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50/30 dark:bg-white/[0.01]"
                      >
                        <td colSpan={7} className="px-8 py-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                <Package size={14} className="text-primary" />
                                Inventory Protocol
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {order.order_items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 gap-4 group/item">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover/item:border-primary/30 transition-all shrink-0">
                                      {item.products?.image_url ? (
                                        <img src={item.products.image_url} alt="Item" className="w-full h-full object-cover rounded-lg" />
                                      ) : (
                                        <Package size={24} />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1">{item.products?.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400">By {item.products?.farmer?.full_name}</p>
                                      <div className="flex items-center gap-3 mt-2">
                                         <p className="text-xs font-black text-primary">{item.price_at_purchase.toLocaleString()} FCFA</p>
                                         <span className="text-[10px] font-black text-slate-400">x {item.quantity}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Destination Access</h4>
                                <div className="flex items-start gap-3 mb-6">
                                   <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                                   </div>
                                   <p className="text-[11px] font-bold text-white/80 leading-relaxed italic">
                                     {order.shipping_address || 'Regional Logistics Hub, Douala Terminal 4'}
                                   </p>
                                </div>
                                <div className="space-y-3">
                                  <button className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                                    Sync Status
                                  </button>
                                  <button className="w-full py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    Issue Protocol
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              )))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-white/[0.01] flex justify-center border-t border-slate-100 dark:border-white/5">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Protocol Sequence End · {orders.length} Records Verified</p>
        </div>
      </div>
    </div>
  );
}
