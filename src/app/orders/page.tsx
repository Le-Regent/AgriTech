'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { useOffline } from '@/context/OfflineContext';
import { supabaseService } from '@/services/supabaseService';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';

function OrdersContent() {
  const { user } = useUser();
  const { isOnline, saveToCache, getFromCache } = useOffline();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'true');

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      // Load from cache first for fast UI
      const cacheKey = `orders_${user.id}`;
      const cached = await getFromCache(cacheKey);
      if (cached) {
        setOrders(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (!isOnline) {
        setLoading(false);
        return;
      }

      try {
        const data = await supabaseService.getOrders(user.id, user.user_type);
        const ordersData = data || [];
        setOrders(ordersData);
        saveToCache(cacheKey, ordersData);
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        // Error is often "TypeError: Failed to fetch" when network is unstable
        if (error.message?.includes('fetch') || !isOnline) {
          toast.error('Network error while fetching orders. Showing offline data.');
        } else {
          toast.error('Failed to load orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isOnline, getFromCache, saveToCache]);

  const isFarmer = user?.user_type === 'farmer';

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'shipped': return 'bg-indigo-100 text-indigo-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight dark:text-white">{isFarmer ? 'Incoming Orders' : 'My Orders'}</h2>
        <p className="text-slate-500 dark:text-slate-400">
          {isFarmer 
            ? 'Manage your sales and fulfill orders to your customers.' 
            : 'Manage your purchases and track their delivery status.'}
        </p>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-6 rounded-[2rem] flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <h4 className="font-black text-green-800 dark:text-green-400">Success!</h4>
              <p className="text-sm text-green-700 dark:text-green-500/80">Your action was completed successfully.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-500 hover:text-green-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {orders.length > 0 ? (
        <div className="space-y-6">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined">{isFarmer ? 'person' : 'receipt_long'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{isFarmer ? 'Customer' : 'Order ID'}</p>
                      <p className="font-bold dark:text-white">
                        {isFarmer 
                          ? (order.profiles?.full_name || 'AgriTech Customer') 
                          : order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    {!isFarmer && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Merchant</p>
                        <p className="font-bold dark:text-white">{order.order_items?.[0]?.products?.profiles?.full_name || 'AgriTech Seller'}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Date</p>
                      <p className="font-bold dark:text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total</p>
                      <p className="font-black text-primary">{order.total_amount.toLocaleString()} CFA</p>
                    </div>
                    <div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                      const currentStep = getStatusStep(order.status);
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 flex-1 relative">
                          {idx < 3 && (
                            <div className={`absolute left-1/2 top-4 w-full h-0.5 ${idx < currentStep ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                            isCompleted ? 'bg-primary text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {isCompleted ? 'check' : 'radio_button_unchecked'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent ? 'text-primary' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                          }`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {isFarmer && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {order.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            try {
                              await supabaseService.updateOrderStatus(order.id, 'processing');
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'processing' } : o));
                              toast.success('Order accepted!');
                            } catch (err) {
                              toast.error('Failed to update order');
                            }
                          }}
                          className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                          Accept Order
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button 
                          onClick={async () => {
                            try {
                              await supabaseService.updateOrderStatus(order.id, 'shipped');
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped' } : o));
                              toast.success('Order marked as shipped!');
                            } catch (err) {
                              toast.error('Failed to update order');
                            }
                          }}
                          className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined">local_shipping</span>
                          Mark as Shipped
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                           <span className="material-symbols-outlined">info</span>
                           Waiting for buyer confirmation
                        </div>
                      )}
                    </div>
                  )}

                  {!isFarmer && order.status === 'shipped' && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">local_shipping</span>
                        Track Shipment
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await supabaseService.updateOrderStatus(order.id, 'delivered');
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
                            toast.success('Order marked as received!');
                          } catch (err) {
                            console.error('Failed to update order status:', err);
                            toast.error('Failed to update order status');
                          }
                        }}
                        className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Mark as Received
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0">
                          <ResponsiveImage
                            src={item.products?.image_url || 'https://picsum.photos/seed/product/100/100'}
                            alt={item.products?.name}
                            className="w-full h-full object-cover"
                            baseWidth={100}
                            baseHeight={100}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm dark:text-white truncate">{item.products?.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.quantity} {item.products?.unit} x {item.price_at_purchase.toLocaleString()} CFA
                          </p>
                        </div>
                        <p className="font-bold text-sm dark:text-white">
                          {(item.quantity * item.price_at_purchase).toLocaleString()} CFA
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-4xl">shopping_bag</span>
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">No Orders Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Explore the marketplace to find high-quality agricultural products and start your first order.
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <React.Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />}>
        <OrdersContent />
      </React.Suspense>
    </ProtectedRoute>
  );
}
