'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  RefreshCw,
  Terminal,
  Activity,
  Truck,
  DollarSign,
  Download,
  Filter,
  Search,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

export default function AdminEscrowPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'escrow' | 'payout' | 'completed'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [simulatingHandshake, setSimulatingHandshake] = useState(false);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFarmer, setFilterFarmer] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Bulk Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Playground Console State
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
    setLoading(true);
    try {
      const allOrders = await supabaseService.getAllOrders();
      // Keep relevant order scopes
      const filtered = allOrders.filter(o => 
        ['pending', 'ESCROW_HELD', 'processing', 'shipped', 'delivered', 'COMPLETED', 'refund_pending', 'refund_completed', 'cancelled', 'disputed'].includes(o.status)
      );
      setOrders(filtered);

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

  // 1. Create Sandbox mock transaction
  const generateSandboxOrder = async () => {
    setCreatingDemo(true);
    appendLog('Initiating mock transaction layout creator...');
    try {
      const products = await supabaseService.getProducts();
      if (!products || products.length === 0) {
        appendLog('❌ Error: No products available in catalog. Cannot proceed.');
        toast.error('Please add at least one product in the Farmer panel first.');
        return;
      }

      const profiles = await supabaseService.getAllProfiles();
      if (!profiles || profiles.length === 0) {
        appendLog('❌ Error: No registered profiles found.');
        toast.error('No buyer/farmer profiles available.');
        return;
      }

      const buyerActor = profiles.find(p => p.id === user?.id) || profiles[0];
      const selectedProduct = products[0];
      
      const price = Number(selectedProduct.price) || 3500;
      const quantity = 3;
      const totalAmount = price * quantity;

      const orderData = {
        buyer_id: buyerActor.id,
        total_amount: totalAmount,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        shipping_address: 'Bonamoussadi Douala, Cameroon (MoMo Sandbox)',
        sender_phone: '237671122334'
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

        appendLog(`✅ Order #${order.id.slice(0, 8).toUpperCase()} inserted successfully.`);
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

  // 2. Simulate payments verification via API Status Sync
  const runSimulatePaymentSuccess = async (order: any) => {
    if (!order) return;
    setSimulatingPayment(true);
    appendLog(`Triggering MoMo collect simulation for: #${order.id.slice(0, 8).toUpperCase()}...`);

    try {
      const payments = await supabaseService.getPaymentsByOrderId(order.id);
      const matchingPayment = payments?.[0];
      const reference = matchingPayment?.campay_reference || `sim_col_${order.id}_mock`;

      appendLog(`Checking Status API using reference: ${reference}`);

      const response = await fetch(`/api/payment/status?reference=${reference}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment status check failed');
      }

      appendLog(`🎉 API status check returned [${data.status}] for ${data.amount} ${data.currency}.`);
      toast.success('Sandbox payment verified! Escrow holds active.');
      
      await loadOrders();
    } catch (err: any) {
      appendLog(`❌ Payment check failed: ${err.message || err}`);
      toast.error(err.message || 'Payment simulation failed');
    } finally {
      setSimulatingPayment(false);
    }
  };

  // 3. OTP Handshake Simulation
  const runSimulateHandshake = async (order: any) => {
    if (!order) return;
    setSimulatingHandshake(true);
    const otpToVerify = order.otp_code || '1234';
    appendLog(`Flashing Delivery OTP [${otpToVerify}] for #${order.id.slice(0, 8).toUpperCase()}...`);

    try {
      await supabaseService.updateOrderStatus(order.id, 'delivered');
      appendLog(`✅ Escrow handshake fulfilled! Order is ready for farmer payout.`);
      toast.success('Delivery OTP verified! State transitioned.');
      await loadOrders();
    } catch (err: any) {
      appendLog(`❌ Handshake failed: ${err.message || err}`);
      toast.error(err.message || 'OTP Verification failed');
    } finally {
      setSimulatingHandshake(false);
    }
  };

  // 4. Admin Disburse release hook
  const handleApprovePayout = async (orderId: string) => {
    setProcessingId(orderId);
    appendLog(`Disbursing 95% payout for Order #${orderId.slice(0, 8).toUpperCase()}...`);
    try {
      await supabaseService.approveEscrowPayout(orderId);
      appendLog(`🎉 MoMo payout executed successfully via Campay!`);
      toast.success('Payout completed successfully!');
      await loadOrders();
    } catch (error: any) {
      appendLog(`❌ Payout failed: ${error.message}`);
      toast.error(error.message || 'Payout failure');
    } finally {
      setProcessingId(null);
    }
  };

  // 5. Admin Refund triggers
  const handleRefundOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reverse this charge and trigger refund via the Campay API?')) return;
    setRefundingOrderId(orderId);
    appendLog(`Triggering escrow charge reverse for order #${orderId.substring(0, 8).toUpperCase()}...`);
    try {
      await supabaseService.initiateRefund(orderId, 'Admin escalation refund override', user?.id || 'admin');
      appendLog('🎉 Reversal command processed! Escrow funds cleared.');
      toast.success('Order refunded completely!');
      await loadOrders();
    } catch (err: any) {
      appendLog(`❌ Reversal failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setRefundingOrderId(null);
    }
  };

  // Bulk Disburse selected items
  const handleBulkDisburse = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Are you sure you want to disburse payouts for all ${selectedOrderIds.length} selected orders?`)) return;

    setBulkProcessing(true);
    appendLog(`Executing bulk disbursement for ${selectedOrderIds.length} orders...`);
    let succeedCount = 0;
    
    for (const orderId of selectedOrderIds) {
      try {
        await supabaseService.approveEscrowPayout(orderId);
        succeedCount++;
      } catch (err: any) {
        appendLog(`❌ Bulk payout failed for order #${orderId.substring(0, 8).toUpperCase()}: ${err.message}`);
      }
    }

    appendLog(`Bulk run completed. Resolved ${succeedCount}/${selectedOrderIds.length} payouts.`);
    toast.success(`Disbursed ${succeedCount} farmer payouts successfully!`);
    setSelectedOrderIds([]);
    setBulkProcessing(false);
    await loadOrders();
  };

  const handleSelectAllPayouts = (e: React.ChangeEvent<HTMLInputElement>, pendingPayoutOrders: any[]) => {
    if (e.target.checked) {
      setSelectedOrderIds(pendingPayoutOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // CSV Report Generator
  const exportToCSV = () => {
    const headers = ['Order UUID ID', 'Date Created', 'Grand Total (FCFA)', 'Status Badge', 'OTP Code', 'Buyer Account Name', 'Farmer Client Name'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleDateString(),
      o.total_amount,
      o.status,
      o.otp_code || 'NONE_YET',
      o.buyer?.full_name || 'Buyer Customer',
      o.order_items?.[0]?.products?.farmer?.full_name || 'Farmer Client'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KamerFresh_Escrow_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Escrow registry CSV report generated.');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterFarmer('');
    setFilterBuyer('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    toast.info('Ledger filters reset.');
  };

  // Apply full range of filters dynamically
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Basic free query search
      if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Farmer name match
      if (filterFarmer) {
        const farmerName = o.order_items?.[0]?.products?.farmer?.full_name || '';
        if (!farmerName.toLowerCase().includes(filterFarmer.toLowerCase())) {
          return false;
        }
      }

      // Buyer name match
      if (filterBuyer) {
        const buyerName = o.buyer?.full_name || '';
        if (!buyerName.toLowerCase().includes(filterBuyer.toLowerCase())) {
          return false;
        }
      }

      // Date range validation
      if (startDate && new Date(o.created_at) < new Date(startDate)) {
        return false;
      }
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (new Date(o.created_at) > nextDay) {
          return false;
        }
      }

      // Value amount bracket check
      if (minAmount && o.total_amount < Number(minAmount)) {
        return false;
      }
      if (maxAmount && o.total_amount > Number(maxAmount)) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, filterFarmer, filterBuyer, startDate, endDate, minAmount, maxAmount]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const escrowActive = filteredOrders.filter(o => ['ESCROW_HELD', 'processing', 'shipped'].includes(o.status));
  const pendingPayouts = filteredOrders.filter(o => o.status === 'delivered');
  const completed = filteredOrders.filter(o => ['COMPLETED', 'cancelled', 'refund_completed'].includes(o.status));

  const displayedOrders = (() => {
    switch (activeTab) {
      case 'pending': return pendingOrders;
      case 'escrow': return escrowActive;
      case 'payout': return pendingPayouts;
      case 'completed': return completed;
      default: return filteredOrders;
    }
  })();

  // Dynamically compute real balances
  const escrowTotals = useMemo(() => {
    const activeEscrowAmount = orders
      .filter(o => ['ESCROW_HELD', 'processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const finalizedAmount = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const refundedSum = orders
      .filter(o => ['refund_completed', 'cancelled'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return { activeEscrowAmount, finalizedAmount, refundedSum };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-[4px] border-primary border-t-transparent shadow-md"></div>
        <p className="text-xs uppercase font-black tracking-widest text-slate-400">Syncing Escrow Vaults...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic flex items-center gap-2">
            <ShieldCheck className="text-primary hidden sm:inline" size={32} />
            SafePay Vault Ledger
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">
            MTN MoMo & Orange Payments Escrow Clearing Center
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            type="button"
            onClick={loadOrders}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh Data Logs"
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            type="button"
            onClick={exportToCSV}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-primary transition-all shadow-sm flex items-center gap-1.5 text-xs font-black uppercase"
            title="Export CSV document"
          >
            <Download size={15} />Export CSV
          </button>

          <button
            type="button"
            onClick={generateSandboxOrder}
            disabled={creatingDemo}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {creatingDemo ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Simulate New Buyer
          </button>
        </div>
      </div>

      {/* Escrow Real balances summary charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Escrow Custody</span>
            <p className="text-2xl font-black text-primary">{escrowTotals.activeEscrowAmount.toLocaleString()} FCFA</p>
          </div>
          <Wallet size={24} className="text-primary opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-white/5 flex items-center justify-between text-slate-800 dark:text-white">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trades Finalized</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{escrowTotals.finalizedAmount.toLocaleString()} FCFA</p>
          </div>
          <CheckCircle2 size={24} className="text-emerald-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-white/5 flex items-center justify-between text-slate-800 dark:text-white">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reversed / Refunded</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{escrowTotals.refundedSum.toLocaleString()} FCFA</p>
          </div>
          <RotateCcw size={24} className="text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Interactive Testing Playground */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Step-by-Step Sandbox Interactive Module */}
        <div className="xl:col-span-2 bg-slate-950 text-white rounded-[2.5rem] p-6 border border-white/10 shadow-xl flex flex-col justify-between min-h-[460px] relative">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="text-primary" size={18} />
                <h2 className="text-sm font-black uppercase tracking-tight italic">
                  MoMo Escrow Interactive Sandbox
                </h2>
              </div>
              <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-red-400 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                VIRTUAL TERMINAL READY
              </span>
            </div>

            {!selectedOrder ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">No Transaction Selected</h3>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-3">
                    Choose one of the active orders in the tables below or generate a test order to simulate the Cameroon mobile payment lifecycle.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Secured Order ID</span>
                    <p className="font-mono text-white truncate text-xs mt-0.5">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Total Charge</span>
                    <p className="font-bold text-amber-400 text-xs mt-0.5">{selectedOrder.total_amount?.toLocaleString() || 0} FCFA</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Status Class</span>
                    <span className={`inline-block mt-1 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                      selectedOrder.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                      selectedOrder.status === 'ESCROW_HELD' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                      selectedOrder.status === 'shipped' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                      selectedOrder.status === 'delivered' ? 'bg-green-500/25 text-green-400 border border-green-500/20' :
                      'bg-slate-500/15 text-slate-450 border border-white/10'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Buyer Action</span>
                    {['pending', 'ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) && (
                      <button 
                        type="button"
                        onClick={() => handleRefundOrder(selectedOrder.id)}
                        disabled={refundingOrderId === selectedOrder.id}
                        className="mt-1 text-[8px] font-black text-rose-400 bg-rose-950/30 hover:bg-rose-900/30 px-2.5 py-1 rounded border border-rose-500/25 self-start cursor-pointer uppercase transition-all"
                      >
                        {refundingOrderId === selectedOrder.id ? 'Reversing...' : 'Force Gateway Refund'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Linear Track */}
                <div className="space-y-3">
                  <h4 className="text-[9px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
                    <Activity size={10} className="text-primary" />
                    Transaction Lifecycle Flow
                  </h4>

                  {/* STEP 1: Pay Collection */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    selectedOrder.status === 'pending' ? 'bg-amber-500/5 border-amber-500/25' : 'bg-white/[0.02] border-white/5 opacity-55'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-amber-500 text-white">
                          {selectedOrder.status === 'pending' ? '1' : '✓'}
                        </span>
                        <h5 className="text-xs font-black uppercase text-white">1. MoMo Customer Collection</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-md">
                        Buyer gets prompt for total value. Sandbox simulates local telecom routing codes immediately.
                      </p>
                    </div>
                    {selectedOrder.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => runSimulatePaymentSuccess(selectedOrder)}
                        disabled={simulatingPayment}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all self-start sm:self-center cursor-pointer"
                      >
                        {simulatingPayment ? 'Syncing...' : 'Simulate Success'}
                      </button>
                    )}
                  </div>

                  {/* STEP 2: Delivery & OTP Handshake */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    ['ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) ? 'bg-primary/5 border-primary/25' : 'bg-white/[0.02] border-white/5 opacity-55'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-indigo-500 text-white">
                          ✓
                        </span>
                        <h5 className="text-xs font-black uppercase text-white flex items-center gap-2 flex-wrap">
                          2. Handshake Verification Code
                          {selectedOrder.otp_code && (
                            <span className="font-mono bg-white/10 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-white/5">
                              OTP: {selectedOrder.otp_code}
                            </span>
                          )}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-sm">
                        Products delivered to cargo logs. Buyer declares physical receipt by supplying verification code.
                      </p>
                    </div>

                    {['ESCROW_HELD', 'processing', 'shipped'].includes(selectedOrder.status) && (
                      <button
                        type="button"
                        onClick={() => runSimulateHandshake(selectedOrder)}
                        disabled={simulatingHandshake}
                        className="bg-primary hover:bg-primary/80 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all self-start sm:self-center cursor-pointer"
                      >
                        {simulatingHandshake ? 'Bypassing...' : 'Auto OTP Confirm'}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Activity Console Terminal logs */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <Terminal size={11} />
              <span className="text-[8px] uppercase font-black tracking-widest font-mono">Real-time Sandbox logs</span>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1 border border-white/5">
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
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-white/5 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-md font-black uppercase tracking-tight text-slate-950 dark:text-white flex items-center gap-2 italic">
              <Info size={16} className="text-amber-500" />
              Developer Escrow Guide
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-150 dark:border-indigo-900/30 rounded-2xl text-[11px] text-indigo-900 dark:text-indigo-400">
                <span className="font-black uppercase text-[8px] tracking-wider block mb-0.5">Admin Security Control</span>
                As an escrow auditor, you hold authority to unlock payout loops, adjudicate open buyer claims, or override failed telecom operations securely.
              </div>

              <div className="space-y-2 text-[11px]">
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>Bulk Release:</strong> You can select multiple delivered handshake orders from the ready tab and payout MTN/Orange wallets in a single click.
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong>Immediate Reversal:</strong> Reversal button calls the verified Campay refund pathway, releasing the frozen amount back to buyers.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 text-center text-[10px] text-slate-400">
            SafePay operates fully validated escrow safeguards for all Cameroonian trades.
          </div>
        </div>

      </div>

      {/* Ledger Filter Drawer Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-white/5 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <h3 className="text-sm font-black uppercase tracking-wider dark:text-white">Filter Transactions</h3>
          </div>
          <button 
            type="button"
            onClick={handleResetFilters}
            className="text-[9px] font-black uppercase text-primary hover:underline"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="search_ord_id">Search Order UUID</label>
            <div className="relative">
              <input 
                id="search_ord_id"
                type="text" 
                placeholder="Paste Order UUID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
              />
              <Search size={12} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="farmer_name">Farmer Name</label>
            <input 
              id="farmer_name"
              type="text" 
              placeholder="e.g. Amadou..." 
              value={filterFarmer}
              onChange={(e) => setFilterFarmer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="buyer_name">Buyer Name</label>
            <input 
              id="buyer_name"
              type="text" 
              placeholder="e.g. Jean..." 
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Total Amount Scope</label>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="Min" 
                aria-label="Minimum amount in FCFA"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                aria-label="Maximum amount in FCFA"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Order Placed Since</label>
            <input 
              type="date" 
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Order Placed Before</label>
            <input 
              type="date" 
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Table: Ready for Payout */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-white/5 bg-green-500/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600">verified</span>
              <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Ready for Farmer Payout ({pendingPayouts.length})</h2>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Confirmed delivery codes. Bulk disbursing available.</p>
          </div>

          {selectedOrderIds.length > 0 && (
            <motion.button
              type="button"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleBulkDisburse}
              disabled={bulkProcessing}
              className="bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign size={13} />
              {bulkProcessing ? 'Disbursing...' : `Bulk Disburse Selected (${selectedOrderIds.length})`}
            </motion.button>
          )}
        </div>

        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[8px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => handleSelectAllPayouts(e, pendingPayouts)}
                    aria-label="Select all orders for payout bulk disbursement"
                    checked={pendingPayouts.length > 0 && selectedOrderIds.length === pendingPayouts.length}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Order Unit</th>
                <th className="px-6 py-4">Farmer Details</th>
                <th className="px-6 py-4">Handover OTP</th>
                <th className="px-6 py-4">Net Payout (95%)</th>
                <th className="px-6 py-4 text-center">Escrow Refund</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {pendingPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                    No orders currently waiting for disbursement.
                  </td>
                </tr>
              ) : (
                pendingPayouts.map((order) => {
                  const farmerProfile = order.order_items?.[0]?.products?.farmer;
                  const payoutValue = order.total_amount * 0.95;
                  const isChecked = selectedOrderIds.includes(order.id);
                  const isCurSelected = order.id === selectedOrderId;
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] cursor-pointer transition-colors ${
                        isCurSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectOrder(order.id)}
                          aria-label={`Select order ${order.id.slice(0, 8)} for disburse`}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black select-all">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{farmerProfile?.full_name || 'Farmer Client'}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-mono bg-purple-50 text-purple-700 dark:bg-purple-950/25 dark:text-purple-400 text-[10px] font-black px-2 py-0.5 rounded border border-purple-200/50 dark:border-purple-900/50 block w-max mx-auto">
                          {order.otp_code || 'NONE_YET'}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-green-600">
                        {payoutValue.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button"
                          onClick={() => handleRefundOrder(order.id)}
                          disabled={refundingOrderId === order.id}
                          className="rounded bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400 border border-rose-150 dark:border-rose-900/40 px-2.5 py-1 text-[9px] font-black uppercase"
                        >
                          {refundingOrderId === order.id ? 'Reversing...' : 'Refund'}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right w-36">
                        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            onClick={() => handleApprovePayout(order.id)}
                            disabled={processingId === order.id}
                            className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {processingId === order.id ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <DollarSign size={11} />
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
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Escrow Ledger ({displayedOrders.length})</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Audit complete trade listings and mobile gateway transactions.</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
            {(['all', 'pending', 'escrow', 'payout', 'completed'] as const).map((tab) => {
              const label = tab === 'all' ? 'All' 
                          : tab === 'pending' ? 'Awaiting Payment' 
                          : tab === 'escrow' ? 'Active Escrow' 
                          : tab === 'payout' ? 'Awaiting Payout' 
                          : 'Completed/Logs';
              const count = tab === 'all' ? filteredOrders.length
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
                      : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[8px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Transaction Unit</th>
                <th className="px-6 py-4">Buyer Customer</th>
                <th className="px-6 py-4">Seller Partner</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4 text-center">Handshake OTP</th>
                <th className="px-6 py-4 text-right">Secured Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs italic">
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
                        <span className="text-xs font-black">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate block w-28">
                          {order.buyer?.full_name || 'Buyer Client'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate block w-28">
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
                          ['COMPLETED'].includes(order.status) ? 'bg-slate-500/5 text-slate-500 border-slate-500/20 dark:text-slate-400' :
                          'bg-rose-500/15 text-rose-500 border-rose-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-mono bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                          {order.otp_code || 'NONE'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black">
                        {order.total_amount?.toLocaleString()} FCFA
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
