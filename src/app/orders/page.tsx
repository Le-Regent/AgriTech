'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
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

      if (!user || !user.user_type) return;
      
      try {
        const data = await supabaseService.getOrders(user.id, user.user_type as 'farmer' | 'buyer');
        const ordersData = data || [];
        setOrders(ordersData);
        saveToCache(cacheKey, ordersData);
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    try {
      await supabaseService.updateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];
    
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [orders, statusFilter, sortBy]);

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'ESCROW_HELD', 'processing', 'shipped', 'delivered', 'COMPLETED'];
    return steps.indexOf(status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'ESCROW_HELD': return 'bg-primary/20 text-primary';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'shipped': return 'bg-indigo-100 text-indigo-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'COMPLETED': return 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const handleVerifyHandshake = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      toast.error('Please enter the 4-digit code provided by the buyer');
      return;
    }

    try {
      await supabaseService.verifyOrderOTP(orderId, otp);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
      toast.success('Handshake Verified! Payout initiated.');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    }
  };

  const handleFileUpload = async (orderId: string, file: File) => {
    const loadingToast = toast.loading('Uploading evidence...');
    try {
      const url = await supabaseService.uploadOrderEvidence(orderId, file);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'shipped', evidence_url: url } : o));
      toast.success('Evidence uploaded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to upload evidence.', { id: loadingToast });
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight dark:text-white">{isFarmer ? 'Incoming Orders' : 'My Orders'}</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {isFarmer 
              ? 'Manage your sales and fulfill orders to your customers.' 
              : 'Manage your purchases and track their delivery status.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <span className="material-symbols-outlined text-slate-400 text-sm">filter_list</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold dark:text-white outline-none border-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <span className="material-symbols-outlined text-slate-400 text-sm">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="bg-transparent text-xs font-bold dark:text-white outline-none border-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
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

      {filteredAndSortedOrders.length > 0 ? (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredAndSortedOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div 
                  className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
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
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrders.has(order.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-white/5">
                        {order.status !== 'cancelled' ? (
                          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 gap-4 no-scrollbar">
                            {['Pending', 'Escrow', 'Processing', 'Shipped', 'Handshake', 'Done'].map((step, idx) => {
                              const currentStep = getStatusStep(order.status);
                              const isCompleted = idx <= currentStep;
                              const isCurrent = idx === currentStep;
                              
                              return (
                                <div key={step} className="flex flex-col items-center gap-2 flex-1 min-w-[70px] relative">
                                  {idx < 5 && (
                                    <div className={`absolute left-1/2 top-4 w-full h-0.5 ${idx < currentStep ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
                                  )}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                                    isCompleted ? 'bg-primary text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  }`}>
                                    <span className="material-symbols-outlined text-sm">
                                      {isCompleted ? 'check' : 'radio_button_unchecked'}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest text-center ${
                                    isCurrent ? 'text-primary' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                  }`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl mb-8">
                            <span className="material-symbols-outlined">cancel</span>
                            <span className="text-xs font-black uppercase tracking-widest">This order has been cancelled</span>
                          </div>
                        )}

                        {/* Escrow Guidance */}
                        {order.status === 'ESCROW_HELD' && (
                          <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-[2rem] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-2xl">shield_with_heart</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-sm text-primary dark:text-primary-light uppercase tracking-tight">Funds Held in Escrow</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isFarmer 
                                  ? "Payment is secured in our vault. You can now start processing the produce safely."
                                  : "Your funds are safe. The seller will only be paid once you provide the delivery OTP."}
                              </p>
                            </div>
                            {isFarmer && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await supabaseService.updateOrderStatus(order.id, 'processing');
                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'processing' } : o));
                                    toast.success('Status updated to Processing');
                                  } catch (err) {
                                    toast.error('Failed to update status');
                                  }
                                }}
                                className="bg-primary text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
                              >
                                Start Processing
                              </button>
                            )}
                          </div>
                        )}

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Order Items</h5>
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
                                      {!isFarmer && (
                                        <p className="text-[10px] text-primary font-bold mt-0.5">
                                          Seller: {item.products?.profiles?.full_name || 'AgriTech Seller'}
                                        </p>
                                      )}
                                    </div>
                                    <p className="font-bold text-sm dark:text-white">
                                      {(item.quantity * item.price_at_purchase).toLocaleString()} CFA
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Delivery Information</h5>
                              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-slate-400 mt-1">location_on</span>
                                  <div>
                                    <p className="text-xs font-bold dark:text-white">Shipping Address</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.shipping_address || 'No address provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {isFarmer ? (
                            <div className="flex flex-col sm:flex-row gap-4">
                              {order.status === 'pending' && (
                                <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-4 rounded-2xl font-black text-sm cursor-not-allowed">
                                  Waiting for Payment Escrow
                                </button>
                              )}
                              {order.status === 'processing' && (
                                <div className="flex-1 space-y-4">
                                  <label htmlFor={`waybill-${order.id}`} className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Shipment Evidence (Waybill)</label>
                                  <input 
                                    type="file" 
                                    id={`waybill-${order.id}`}
                                    className="hidden" 
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(order.id, e.target.files[0])}
                                  />
                                  <label 
                                    htmlFor={`waybill-${order.id}`}
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm cursor-pointer hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                  >
                                    <span className="material-symbols-outlined">upload_file</span>
                                    Upload Waybill & Mark Shipped
                                  </label>
                                </div>
                              )}
                              {order.status === 'shipped' && (
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handshake Delivery (Verify Buyer OTP)</label>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        maxLength={4}
                                        value={otpInputs[order.id] || ''}
                                        onChange={(e) => setOtpInputs({...otpInputs, [order.id]: e.target.value})}
                                        placeholder="4-digit code"
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-black tracking-[0.5em] text-center outline-none focus:ring-2 focus:ring-primary/20 text-lg dark:text-white"
                                      />
                                      <button 
                                        onClick={() => handleVerifyHandshake(order.id)}
                                        className="bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                                      >
                                        Verify
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-1">Ask the buyer for their unique 4-digit code upon delivery.</p>
                                  </div>
                                </div>
                              )}
                              {order.status === 'delivered' && (
                                <div className="flex-1 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 p-4 rounded-2xl text-green-600 font-bold text-center text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                  <span className="material-symbols-outlined">verified</span>
                                  Handshake Success! Waiting for Payout
                                </div>
                              )}
                              {order.status === 'COMPLETED' && (
                                <div className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black text-center text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                  <span className="material-symbols-outlined">payments</span>
                                  Transaction Completed
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                              {order.status === 'shipped' && (
                                <div className="flex-1 bg-primary/10 border border-primary/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                                  <div className="flex-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Your Delivery Handshake Code</p>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-[0.2em]">{order.otp_code || '8839'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 italic font-bold">
                                      IMPORTANT: Only give this code to the seller AFTER you have inspected your fresh produce. 
                                      Entering this code will release your escrow payment.
                                    </p>
                                  </div>
                                  <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary shadow-xl border border-slate-100 dark:border-slate-800 shrink-0">
                                    <span className="material-symbols-outlined text-5xl">key_visualizer</span>
                                  </div>
                                </div>
                              )}
                              {order.status === 'delivered' && (
                                <div className="flex-1 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 p-6 rounded-[2.5rem] flex items-center gap-4">
                                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                                    <span className="material-symbols-outlined">check</span>
                                  </div>
                                  <div>
                                    <h4 className="font-black text-green-800 dark:text-green-400 uppercase text-xs tracking-widest">Order Received</h4>
                                    <p className="text-[10px] text-green-700 dark:text-green-500 opacity-80 italic">Thank you for confirming your delivery. We hope you enjoy your produce!</p>
                                  </div>
                                </div>
                              )}
                              {order.status === 'pending' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(order.id);
                                  }}
                                  className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 py-4 rounded-2xl font-black text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined">cancel</span>
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-4xl">shopping_bag</span>
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">No Orders Found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            {statusFilter !== 'all' 
              ? `You don't have any orders with status "${statusFilter}".` 
              : 'Explore the marketplace to find high-quality agricultural products and start your first order.'}
          </p>
          {statusFilter !== 'all' && (
            <button 
              onClick={() => setStatusFilter('all')}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Show all orders
            </button>
          )}
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
