'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  History,
  AlertCircle,
  FileCheck,
  Smartphone,
  Info,
  Layers,
  Sparkles,
  Send,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle,
  Truck,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function AdminEscrowPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'escrow' | 'payout' | 'completed'>('all');

  // Playground Sandbox State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [simulatingHandshake, setSimulatingHandshake] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [logs, setLogs] = useState<string[]>([
    '[System] MoMo Sandbox Console initialized.',
    '[System] Ready to run Cameroon Mobile Money & Escrow dry-runs.'
  ]);

  const activityEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (activityEndRef.current) {
      activityEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const loadOrders = async () => {
    try {
      const allOrders = await supabaseService.getAllOrders();
      // Filter for orders that are pending, ESCROW_HELD, shipped, or delivered (handshake done)
      // but especially those ready for final payout (delivered)
      const filtered = allOrders.filter(o => 
        ['pending', 'ESCROW_HELD', 'processing', 'shipped', 'delivered', 'COMPLETED'].includes(o.status)
      );
      setOrders(filtered);

      // Auto-select first order if none selected
      if (filtered.length > 0 && !selectedOrderId) {
        setSelectedOrderId(filtered[0].id);
      }
    } catch (error) {
      console.error('Error loading escrow orders:', error);
      toast.error('Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Instant Sandbox Transaction Creator
  const generateSandboxOrder = async () => {
    setCreatingDemo(true);
    appendLog('Initiating mock transaction layout creator...');
    try {
      // Fetch active products
      const products = await supabaseService.getProducts();
      if (!products || products.length === 0) {
        appendLog('❌ Error: No products available in catalog. Cannot proceed.');
        toast.error('Please add at least one product in the Farmer panel first.');
        return;
      }

      // Fetch profiles
      const profiles = await supabaseService.getAllProfiles();
      if (!profiles || profiles.length === 0) {
        appendLog('❌ Error: No registered profiles found.');
        toast.error('No buyer/farmer profiles available.');
        return;
      }

      // Find appropriate buyer and farmer actors
      const buyerActor = profiles.find(p => p.id === user?.id) || profiles[0];
      const selectedProduct = products[0];
      const farmerActorId = selectedProduct.farmer_id || profiles.find(p => p.id !== buyerActor.id)?.id || buyerActor.id;

      const price = Number(selectedProduct.price) || 3500;
      const quantity = 2;
      const totalAmount = price * quantity;

      appendLog(`Picked Product: "${selectedProduct.name}" | Farmer ID: ${farmerActorId.slice(0, 8)}`);

      const orderData = {
        buyer_id: buyerActor.id,
        total_amount: totalAmount,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        shipping_address: 'Deido Douala, Cameroon (MoMo Sandbox Hub)',
        sender_phone: '237677112233' // Cameroonian MoMo format
      };

      const orderItems = [
        {
          product_id: selectedProduct.id,
          quantity: quantity,
          price_at_purchase: price
        }
      ];

      appendLog(`Saving simulated order to cloud database...`);
      const order = await supabaseService.createOrder(orderData, orderItems);

      if (order) {
        // Generate corresponding pending payment Reference
        const reference = `sim_col_${order.id}_${Math.random().toString(36).substring(2, 8)}`;
        
        await supabaseService.createPayment({
          order_id: order.id,
          campay_reference: reference,
          amount: totalAmount,
          currency: 'XAF',
          status: 'pending',
          method: 'mobile-money',
          created_at: new Date().toISOString()
        });

        appendLog(`✅ Order #${order.id.slice(0, 8).toUpperCase()} inserted successfully. Total: ${totalAmount.toLocaleString()} CFA.`);
        appendLog(`✅ Registered pending payment reference: ${reference}`);
        toast.success('Generated sandbox escrow order!');
        
        await loadOrders();
        setSelectedOrderId(order.id);
      }
    } catch (err: any) {
      appendLog(`❌ Order creation failed: ${err.message || err}`);
      toast.error(err.message || 'Error generating test transaction');
    } finally {
      setCreatingDemo(false);
    }
  };

  // 2. Step 1 Action: Simulate payment SUCCESS via GET /api/payment/status
  const runSimulatePaymentSuccess = async (order: any) => {
    if (!order) return;
    setSimulatingPayment(true);
    appendLog(`Triggering MoMo collect simulation for: #${order.id.slice(0, 8).toUpperCase()}...`);

    try {
      // Find related campay payment record
      const payments = await supabaseService.getPaymentsByOrderId(order.id);
      const matchingPayment = payments?.[0];
      const reference = matchingPayment?.campay_reference || `sim_col_${order.id}_mock`;

      appendLog(`Checking Status API using reference: ${reference}`);

      // Hit our GET /api/payment/status?reference=...
      const response = await fetch(`/api/payment/status?reference=${reference}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment status check failed');
      }

      appendLog(`🎉 API status check returned [${data.status}] for ${data.amount} ${data.currency}.`);
      appendLog(`[Database Sync] Order status upgraded to ESCROW_HELD. Secure delivery code generated!`);
      toast.success('Sandbox payment verified! Funds are now securely locked in Escrow.');
      
      await loadOrders();
    } catch (err: any) {
      appendLog(`❌ Payment check failed: ${err.message || err}`);
      toast.error(err.message || 'Payment simulation failed');
    } finally {
      setSimulatingPayment(false);
    }
  };

  // 3. Step 2 Action: Simulate ways/OTP handshake verification (Buyer provides OTP)
  const runSimulateHandshake = async (order: any, manualOtp?: string) => {
    if (!order) return;
    setSimulatingHandshake(true);
    const otpToVerify = manualOtp || order.otp_code || '1234';
    appendLog(`Validating Secure Handshake OTP [${otpToVerify}] for #${order.id.slice(0, 8).toUpperCase()}...`);

    try {
      if (order.otp_code && otpToVerify !== order.otp_code) {
        throw new Error(`Invalid OTP. Generated code is ${order.otp_code}.`);
      }

      appendLog(`OTP code successfully matched. Moving order to [delivered] state.`);
      await supabaseService.updateOrderStatus(order.id, 'delivered');
      appendLog(`✅ Escrow handshake fulfilled! Buyer and logistics confirm delivery.`);
      appendLog(`[Audit] Farmer payout is now unlocked and awaiting release.`);
      toast.success('Delivery OTP verified! Order status updated to READY FOR PAYOUT.');
      
      await loadOrders();
    } catch (err: any) {
      appendLog(`❌ Handshake failed: ${err.message || err}`);
      toast.error(err.message || 'OTP Verification failed');
    } finally {
      setSimulatingHandshake(false);
      setOtpInput('');
    }
  };

  // 4. Step 3 Action: Disburse farmer payouts (MTN / Orange payout withdrawal)
  const handleApprovePayout = async (orderId: string) => {
    setProcessingId(orderId);
    appendLog(`Disbursing 95% payout for Order #${orderId.slice(0, 8).toUpperCase()} via Mobile Money...`);
    try {
      await supabaseService.approveEscrowPayout(orderId);
      appendLog(`🎉 MoMo payout executed successfully via Campay Payout Broker!`);
      appendLog(`[Database] Order #${orderId.slice(0, 8).toUpperCase()} status progressed to COMPLETED.`);
      toast.success('Payout completed! Funds successfully transferred to the farmer.');
      await loadOrders();
    } catch (error: any) {
      appendLog(`❌ Payout failed: ${error.message || 'Payout failed. Please verify provider configs.'}`);
      toast.error(error.message || 'Payout failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-[4px] border-primary border-t-transparent shadow-md"></div>
        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Syncing Escrow Vaults...</p>
      </div>
    );
  }

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const escrowActive = orders.filter(o => ['ESCROW_HELD', 'processing', 'shipped'].includes(o.status));
  const pendingPayouts = orders.filter(o => o.status === 'delivered');
  const completed = orders.filter(o => ['COMPLETED', 'cancelled'].includes(o.status));

  const displayedOrders = (() => {
    switch (activeTab) {
      case 'pending': return pendingOrders;
      case 'escrow': return escrowActive;
      case 'payout': return pendingPayouts;
      case 'completed': return completed;
      default: return [...pendingOrders, ...escrowActive, ...pendingPayouts, ...completed];
    }
  })();

  const stats = [
    { id: 'pending' as const, label: 'Awaiting Payment', count: pendingOrders.length, icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/10' },
    { id: 'escrow' as const, label: 'Active Escrow', count: escrowActive.length, icon: Wallet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/10' },
    { id: 'payout' as const, label: 'Ready for Payout', count: pendingPayouts.length, icon: FileCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' },
    { id: 'completed' as const, label: 'Completed Trades', count: completed.length, icon: History, color: 'text-slate-500 bg-slate-500/10 border-slate-500/10' },
  ];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic flex items-center gap-2">
            <ShieldCheck className="text-primary hidden sm:inline" size={32} />
            SafePay Hub
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">
            MTN MoMo & Orange Money Escrow Safe-Payment Portal
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={loadOrders}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={generateSandboxOrder}
            disabled={creatingDemo}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {creatingDemo ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} className="animate-pulse" />
            )}
            Simulate New Buyer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const isSelected = activeTab === stat.id;
          return (
            <button 
              key={i} 
              onClick={() => setActiveTab(isSelected ? 'all' : stat.id)}
              className={`bg-white dark:bg-slate-900 p-5 rounded-[2rem] border flex items-center gap-4 shadow-sm transition-all hover:scale-[1.01] text-left w-full cursor-pointer ${
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-slate-950' 
                  : 'border-slate-100 dark:border-white/5'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} border`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                <p className="text-xl font-black text-slate-950 dark:text-white mt-1">{stat.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Testing Playground */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Step-by-Step Sandbox Interactive Module */}
        <div className="xl:col-span-2 bg-slate-950 text-white rounded-[2.5rem] p-6 lg:p-8 border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between min-h-[500px] relative">
          
          {/* Subtle glowing nodes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="text-primary animate-bounce duration-1000" size={20} />
                <h2 className="text-md sm:text-lg font-black uppercase tracking-tight italic">
                  MoMo & Escrow Sandbox Playground
                </h2>
              </div>
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-red-400 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                CAMEROON SANDBOX ACTIVE
              </span>
            </div>

            {!selectedOrder ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Transaction Selected</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    Choose one of the active orders in the tables below or generate a test order to simulate the Cameroon mobile payment lifecycle.
                  </p>
                  <button
                    onClick={generateSandboxOrder}
                    disabled={creatingDemo}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Generate Test Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Secured Order</p>
                    <p className="font-black text-white truncate mt-0.5">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Total Amount</p>
                    <p className="font-bold text-amber-400 mt-0.5">{selectedOrder.total_amount?.toLocaleString() || 0} CFA</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Status</p>
                    <span className={`inline-block mt-1 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                      selectedOrder.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      selectedOrder.status === 'ESCROW_HELD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      selectedOrder.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      selectedOrder.status === 'delivered' ? 'bg-green-500/25 text-green-400 border border-green-500/20' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Phone</p>
                    <p className="font-mono text-slate-300 truncate mt-0.5">{selectedOrder.sender_phone || '237677112233'}</p>
                  </div>
                </div>

                {/* Progress Linear Track */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity size={10} className="text-primary" />
                    Interactive Transaction Steps
                  </h4>

                  {/* STEP 1: Pay Collection */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    selectedOrder.status === 'pending'
                      ? 'bg-amber-500/5 border-amber-500/20 scale-[1.01]'
                      : 'bg-white/[0.02] border-white/5 opacity-65'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          selectedOrder.status === 'pending' ? 'bg-amber-500 text-white animate-pulse' : 'bg-green-500 text-white'
                        }`}>
                          {selectedOrder.status === 'pending' ? '1' : '✓'}
                        </span>
                        <h5 className="text-xs font-black uppercase text-white tracking-wider">MTN/Orange MoMo Collect</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                        Buyer receives a push prompt for <strong>{selectedOrder.total_amount?.toLocaleString() || 0} CFA</strong>. Sandbox bypasses cellular fees.
                      </p>
                    </div>
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => runSimulatePaymentSuccess(selectedOrder)}
                        disabled={simulatingPayment}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black tracking-wider uppercase px-4 py-3 rounded-xl transition-all self-start sm:self-center flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {simulatingPayment ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        Simulate Success
                      </button>
                    )}
                  </div>

                  {/* STEP 2: Delivery & OTP Handshake */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    ['ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status)
                      ? 'bg-primary/5 border-primary/20 scale-[1.01]'
                      : ['delivered', 'COMPLETED'].includes(selectedOrder.status)
                      ? 'bg-white/[0.02] border-white/5 opacity-65'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-35 pointer-events-none'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          ['ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) 
                            ? 'bg-primary text-white animate-pulse'
                            : ['delivered', 'COMPLETED'].includes(selectedOrder.status) 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/10 text-slate-400'
                        }`}>
                          {['pending', 'ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) ? '2' : '✓'}
                        </span>
                        <h5 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          Waybill & Secure Delivery OTP
                          {selectedOrder.otp_code && (
                            <span className="font-mono bg-white/10 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-lg border border-white/5 uppercase">
                              Active OTP Code: {selectedOrder.otp_code}
                            </span>
                          )}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                        Products reach the buyer. Buyer inspects freshness and confirms handover code to release escrow.
                      </p>
                    </div>

                    {['ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) && (
                      <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                        <button
                          onClick={() => runSimulateHandshake(selectedOrder)}
                          disabled={simulatingHandshake}
                          className="bg-primary hover:bg-primary/80 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {simulatingHandshake ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Truck size={12} />
                          )}
                          Auto-Handshake
                        </button>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: Farmer Disbursement */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    selectedOrder.status === 'delivered'
                      ? 'bg-green-500/5 border-green-500/20 scale-[1.01]'
                      : selectedOrder.status === 'COMPLETED'
                      ? 'bg-white/[0.02] border-white/5 opacity-65'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-35 pointer-events-none'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          selectedOrder.status === 'delivered' ? 'bg-green-500 text-white animate-pulse' :
                          selectedOrder.status === 'COMPLETED' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'
                        }`}>
                          {selectedOrder.status === 'COMPLETED' ? '✓' : '3'}
                        </span>
                        <h5 className="text-xs font-black uppercase text-white tracking-wider">Farmer Disbursement Payout (95%)</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                        Release <strong>{((selectedOrder.total_amount || 0) * 0.95).toLocaleString()} CFA</strong> to the farmer&apos;s mobile wallet instantly.
                      </p>
                    </div>

                    {selectedOrder.status === 'delivered' && (
                      <button
                        onClick={() => handleApprovePayout(selectedOrder.id)}
                        disabled={processingId === selectedOrder.id}
                        className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {processingId === selectedOrder.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <DollarSign size={12} />
                        )}
                        Disburse Funds
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Console Terminal logs */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <Terminal size={12} />
              <span className="text-[9px] uppercase font-black tracking-widest font-mono">Sandbox Action Logs</span>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1 border border-white/5">
              {logs.map((log, index) => (
                <p key={index} className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : log.includes('🎉') ? 'text-amber-300 font-bold' : ''}>
                  {log}
                </p>
              ))}
              <div ref={activityEndRef} />
            </div>
          </div>
        </div>

        {/* Informative Side Card on MoMo setup */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 lg:p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <h3 className="text-md sm:text-lg font-black uppercase tracking-tight text-slate-950 dark:text-white flex items-center gap-2 italic">
              <Info size={18} className="text-amber-500" />
              Cameroon MoMo Guides
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl">
                <p className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[9px] tracking-wider mb-1">Testing Credentials</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[10px]">
                  Setting your Campay API keys toggles production rails to Orange Money/MTN in settings.
                  Leaving credentials blank defaults to Sandbox/Virtual payments.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 text-[10px]">
                  <span className="font-black text-slate-400 min-w-4">01.</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Payment Collection:</strong> Triggered on customer checkout. System posts payload to Campay collect broker endpoints.
                  </p>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="font-black text-slate-400 min-w-4">02.</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Escrow Hold:</strong> Successfully verified payments automatically transition the transaction state to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">ESCROW_HELD</code> and issue a 4-digit Delivery Pin.
                  </p>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="font-black text-slate-400 min-w-4">03.</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Buyer OTP Handshake:</strong> Farmers show waybills. Once buyer confirms receipt, inputting the OTP code frees funds to payout queue.
                  </p>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="font-black text-slate-400 min-w-4">04.</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Farmer Disbursement:</strong> Admin triggers disbursement. Platform releases 95% value to farmer&apos;s MoMo account and logs 5% to public treasury records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50 dark:border-white/5">
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              SafePay ensures total escrow transparency. Fully compatible with local Cameroonian network codes and merchant setups.
            </p>
          </div>
        </div>

      </div>

      {/* Action Table: Ready for Payout */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-white/5 bg-green-500/[0.02]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600">verified</span>
            <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Ready for Farmer Payout ({pendingPayouts.length})</h2>
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Confirmed delivery handshake. SafePay release cleared.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Order Unit</th>
                <th className="px-6 py-4">Farmer Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Net Payout (95%)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {pendingPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                    No orders currently waiting for disbursement.
                  </td>
                </tr>
              ) : (
                pendingPayouts.map((order) => {
                  const farmerProfile = order.order_items?.[0]?.products?.farmer;
                  const payoutValue = order.total_amount * 0.95;
                  const isCurSelected = order.id === selectedOrderId;
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] cursor-pointer transition-colors ${
                        isCurSelected ? 'bg-primary/5 dark:bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {isCurSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          <div>
                            <p className="text-xs font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-[10px] font-black uppercase">
                            {farmerProfile?.full_name?.charAt(0) || 'F'}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{farmerProfile?.full_name || 'Farmer Client'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 col-pay">
                        <span className="text-[9px] font-black uppercase bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full border border-green-500/20">
                          Ready
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-green-600">{payoutValue.toLocaleString()} CFA</p>
                        <p className="text-[9px] text-slate-400">Escrow Total: {order.total_amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleApprovePayout(order.id)}
                            disabled={processingId === order.id}
                            className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {processingId === order.id ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[13px] font-black">send_money</span>
                            )}
                            Disburse
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Table: In Escrow / Transit / Tabs switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Transaction Ledger ({displayedOrders.length})</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Select an order to load it into the Sandbox console above.</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
            {(['all', 'pending', 'escrow', 'payout', 'completed'] as const).map((tab) => {
              const label = tab === 'all' ? 'All' 
                          : tab === 'pending' ? 'Awaiting Payment' 
                          : tab === 'escrow' ? 'Active Escrow' 
                          : tab === 'payout' ? 'Awaiting Payout' 
                          : 'Completed/Logs';
              const count = tab === 'all' ? orders.length
                          : tab === 'pending' ? pendingOrders.length
                          : tab === 'escrow' ? escrowActive.length
                          : tab === 'payout' ? pendingPayouts.length
                          : completed.length;
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-sm border border-slate-100 dark:border-white/5' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Transaction Unit</th>
                <th className="px-6 py-4">Seller Partner</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Delivery Waybill</th>
                <th className="px-6 py-4 text-right">Secured Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                    No matching transactions or logs found.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => {
                  const isCurSelected = order.id === selectedOrderId;
                  const farmerProfile = order.order_items?.[0]?.products?.farmer;
                  return (
                    <tr 
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] cursor-pointer transition-all ${
                        isCurSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {isCurSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          <div>
                            <p className="text-xs font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {farmerProfile?.full_name || 'Farmer Client'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          order.status === 'ESCROW_HELD' ? 'bg-blue-500/15 text-blue-500 border-blue-500/20' : 
                          order.status === 'shipped' ? 'bg-indigo-500/15 text-indigo-500 border-indigo-500/20' : 
                          order.status === 'processing' ? 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20' : 
                          order.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' :
                          order.status === 'COMPLETED' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {order.evidence_url ? (
                          <a 
                            href={order.evidence_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9px] font-black text-primary underline hover:text-primary/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Waybill PDF
                          </a>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">No evidence uploaded</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-xs font-black text-slate-850 dark:text-white">{order.total_amount?.toLocaleString()} CFA</p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
