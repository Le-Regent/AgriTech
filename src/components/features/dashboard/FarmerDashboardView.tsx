'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { downloadDiagnosisReport } from '@/lib/diagnosisUtils';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { CropDiagnosis, Product, AppNotification } from '@/types';

const LiveMap = dynamic(() => import('@/components/ui/LiveMap'), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';

interface FarmerDashboardViewProps {
  user: any;
  t: (key: string) => string;
  diagnoses: CropDiagnosis[];
  myProducts: Product[];
  sellerOrders: any[];
  isOnline: boolean;
  notifications: AppNotification[];
  weather: any;
  forecast: any;
  weatherLoading: boolean;
  setShowCalendar: (show: boolean) => void;
  recentActivities: any[];
  expandedDiagnosisId: string | null;
  setExpandedDiagnosisId: (id: string | null) => void;
  otpInputOrderId: string | null;
  setOtpInputOrderId: (id: string | null) => void;
  otpValue: string;
  setOtpValue: (val: string) => void;
  setSellerOrders: React.Dispatch<React.SetStateAction<any[]>>;
  addToSyncQueue: (type: string, payload: any) => void;
  quickActionsHub: React.ReactNode;
}

export default function FarmerDashboardView({
  user,
  t,
  diagnoses,
  myProducts,
  sellerOrders,
  isOnline,
  notifications,
  weather,
  forecast,
  weatherLoading,
  setShowCalendar,
  recentActivities,
  expandedDiagnosisId,
  setExpandedDiagnosisId,
  otpInputOrderId,
  setOtpInputOrderId,
  otpValue,
  setOtpValue,
  setSellerOrders,
  addToSyncQueue,
  quickActionsHub,
}: FarmerDashboardViewProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex-1">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
            Kamer<span className="text-primary tracking-normal">Fresh</span> 🇨🇲
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">
            Welcome back, {user?.full_name}. Here is what&apos;s happening today.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <button 
            onClick={() => setShowCalendar(true)}
            className="flex-1 sm:flex-none bg-white dark:bg-white/5 dark:text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">calendar_month</span>
            Calendar
          </button>
          
          <Link 
            id="new-diagnosis-btn" 
            href="/diagnosis" 
            className="flex-1 sm:flex-none bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">add_a_photo</span>
            {t('diagnose') || 'Diagnose'}
          </Link>
        </div>
      </motion.div>

      {quickActionsHub}

      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
      >
        {[
          { label: 'Soil Moisture', value: '42%', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { 
            label: 'Crop Health', 
            value: diagnoses.length > 0 ? (diagnoses[0].status === 'healthy' ? '98%' : diagnoses[0].status === 'warning' ? '75%' : '45%') : '94%', 
            icon: 'eco', 
            color: 'text-green-500', 
            bg: 'bg-green-50 dark:bg-green-500/10',
            healthStatus: diagnoses.length > 0 ? diagnoses[0].status : 'healthy'
          },
          { label: 'Est. Harvest', value: '12.4t', icon: 'agriculture', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { 
            label: 'Total Inventory', 
            value: myProducts.length > 0 
              ? `${myProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)} units` 
              : '0 units', 
            icon: 'inventory_2', 
            color: 'text-purple-500', 
            bg: 'bg-purple-50 dark:bg-purple-500/10' 
          },
          { 
            label: 'Pending Orders', 
            value: sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length.toString(), 
            icon: 'pending_actions', 
            color: 'text-amber-500', 
            bg: 'bg-amber-50 dark:bg-amber-500/10' 
          },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            {stat.label === 'Crop Health' && (
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20 blur-2xl ${
                stat.healthStatus === 'healthy' ? 'bg-green-500' : 
                stat.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            )}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center relative`}>
                <span className="material-symbols-outlined fill-1 text-sm sm:text-lg">{stat.icon}</span>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg ${
                stat.label === 'Crop Health' ? (
                  stat.healthStatus === 'healthy' ? 'text-green-500 bg-green-50 dark:bg-green-500/10' :
                  stat.healthStatus === 'warning' ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' :
                  'text-red-500 bg-red-50 dark:bg-red-500/10'
                ) : 'text-green-500 bg-green-50 dark:bg-green-500/10'
              }`}>
                {stat.label === 'Crop Health' ? stat.healthStatus?.toUpperCase() : '+2%'}
              </span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 sm:space-y-8">
          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all text-left">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('field_status_map')}</h3>
              <div className="flex gap-2">
                <button className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-muted-dark rounded-lg text-[10px] sm:text-xs font-bold dark:text-slate-300">
                  {t('satellite')}
                </button>
                <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t('heatmap')}
                </button>
              </div>
            </div>
            <div className="aspect-[16/9] bg-slate-100 dark:bg-muted-dark rounded-xl sm:rounded-2xl overflow-hidden relative group border border-slate-100 dark:border-border-dark">
              <LiveMap 
                center={[4.0511, 9.7679]} 
                zoom={14}
                markers={[
                  { 
                    position: [4.0511, 9.7679], 
                    title: 'North Field', 
                    description: 'Healthy - Corn',
                    sensors: { moisture: 68, temperature: 24, humidity: 78 }
                  },
                  { 
                    position: [4.0530, 9.7710], 
                    title: 'West Sector', 
                    description: 'Warning - Cassava',
                    sensors: { moisture: 42, temperature: 28, humidity: 65 }
                  },
                  { 
                    position: [4.0490, 9.7650], 
                    title: 'South Buffer', 
                    description: 'Healthy - Plantain',
                    sensors: { moisture: 72, temperature: 23, humidity: 82 }
                  }
                ]}
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm flex items-center gap-1.5 sm:gap-2 z-[400]">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse focus:outline-none"></div>
                <span className="text-[10px] sm:text-xs font-bold dark:text-white">{t('live_monitoring')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('orders_to_process')}</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                {sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length} NEW
              </span>
            </div>
            <div className="space-y-4">
              {sellerOrders.length > 0 ? (
                sellerOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl border border-slate-100 dark:border-border-dark">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-border-dark">
                          <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm dark:text-white">{order.profiles?.full_name || 'Buyer'}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">{item.products?.name} x {item.quantity}</span>
                          <span className="font-bold dark:text-white">{(item.quantity * item.price_at_purchase).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            try {
                              if (isOnline) {
                                await supabaseService.updateOrderStatus(order.id, 'processing');
                                toast.success('Order moved to processing');
                              } else {
                                addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'processing' });
                                toast.info('Order accepted offline. Will sync when online.');
                              }
                              setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'processing' } : o));
                            } catch (err) {
                              toast.error('Failed to update order');
                            }
                          }}
                          className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer font-bold"
                        >
                          {t('accept_order')}
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button 
                          onClick={async () => {
                            try {
                              if (isOnline) {
                                await supabaseService.updateOrderStatus(order.id, 'shipped');
                                toast.success('Order marked as shipped');
                              } else {
                                addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'shipped' });
                                toast.info('Order updated offline. Will sync when online.');
                              }
                              setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped' } : o));
                            } catch (err) {
                              toast.error('Failed to update order');
                            }
                          }}
                          className="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 transition-all cursor-pointer font-bold"
                        >
                          {t('mark_shipped')}
                        </button>
                      )}
                      {order.status === 'shipped' && otpInputOrderId !== order.id && (
                        <button 
                          onClick={() => {
                            setOtpInputOrderId(order.id);
                            setOtpValue('');
                          }}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 transition-all cursor-pointer font-bold"
                        >
                          Verify Delivery
                        </button>
                      )}
                      {otpInputOrderId === order.id && (
                        <div className="w-full mt-2 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-[1.25rem] border border-slate-200/55 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Enter 6-Digit Delivery OTP</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={6}
                              placeholder="e.g. 123456"
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                              className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-muted-dark dark:text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary text-center tracking-widest"
                            />
                            <button 
                              onClick={async () => {
                                if (otpValue.length !== 6) {
                                  toast.error('Please enter a 6-digit OTP code');
                                  return;
                                }
                                try {
                                  if (isOnline) {
                                    await supabaseService.updateOrderStatus(order.id, 'delivered');
                                    toast.success('Delivery verified successfully!');
                                  } else {
                                    addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'delivered' });
                                    toast.info('Delivery verified offline. Will sync when online.');
                                  }
                                  setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
                                  setOtpInputOrderId(null);
                                  setOtpValue('');
                                } catch (err) {
                                  toast.error('Failed to verify delivery');
                                }
                              }}
                              className="bg-primary text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/95 cursor-pointer font-bold"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => {
                                setOtpInputOrderId(null);
                                setOtpValue('');
                              }}
                              className="bg-slate-200 dark:bg-muted-dark text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-800 cursor-pointer font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <button className="px-3 bg-slate-200 dark:bg-muted-dark text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-surface-hover-dark transition-all cursor-pointer font-bold">
                        {t('details_btn')}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No orders to process.</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart AI Farmer Advisor & Action Almanac */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-emerald-500/20 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none border border-emerald-500/30 font-bold">
                <span className="material-symbols-outlined text-[13px] animate-pulse">eco</span>
                AGRO-ALMANAC
              </span>
              <span className="text-[10px] font-bold text-slate-400">May Peak Rain</span>
            </div>
            
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-black text-white tracking-tight uppercase">
                Smart Cultivation Advisory
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                High humidity stages detected in West & South-West zones.
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3 text-left">
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0 mt-0.5">verified_user</span>
                <p><strong>Crops:</strong> Plant cassava mounds immediately; inspect banana suckers for efficient drainage to protect roots.</p>
              </div>
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-orange-400 shrink-0 mt-0.5 font-bold">warning</span>
                <p><strong>Risk:</strong> High susceptibility to Cocoa Black Pod Rot. Keep spacing wide and spray safely under recommendations.</p>
              </div>
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-sky-400 shrink-0 mt-0.5">biotech</span>
                <p><strong>Health Scans:</strong> Utilize LeafScanner daily to capture and spot premature blight before outbreak spreads.</p>
              </div>
            </div>
          </div>

          <div className="diagnosis-history-widget bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('past_past_diagnoses') || t('past_diagnoses')}</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md">
                  {diagnoses.length} 
                </span>
              </div>
              <div className="flex gap-4">
                <Link href="/history?tab=diagnoses" className="text-slate-400 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                  {t('view_all')}
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
                <Link href="/diagnosis" className="text-primary text-xs font-black uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all">{t('new_scan')}</Link>
              </div>
            </div>
            <div className="space-y-4">
              {diagnoses.length > 0 ? diagnoses.slice(0, 3).map((diagnosis) => {
                const isExpanded = expandedDiagnosisId === diagnosis.id;
                return (
                  <div key={diagnosis.id} className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-muted-dark/40 rounded-2xl border border-slate-100 dark:border-border-dark transition-all duration-300">
                    <div 
                      onClick={() => setExpandedDiagnosisId(isExpanded ? null : diagnosis.id)}
                      className="flex items-center gap-4 cursor-pointer select-none"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ResponsiveImage 
                          src={diagnosis.image_url} 
                          alt={diagnosis.crop_type} 
                          className="w-full h-full object-cover"
                          baseWidth={100}
                          baseHeight={100}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-sm dark:text-white truncate">{diagnosis.crop_type}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            diagnosis.status === 'healthy' ? 'bg-green-100 text-green-600' :
                            diagnosis.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {diagnosis.result_label || diagnosis.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence: {((diagnosis.confidence || 0) * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-slate-400">{new Date(diagnosis.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                          chevron_right
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-1 space-y-3 overflow-hidden">
                        <div className="text-xs space-y-2">
                          <div>
                            <span className="font-black text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Diagnostic Details</span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">{diagnosis.result_label || 'Healthy Leaf'}</p>
                          </div>
                          {diagnosis.recommendation && (
                            <div>
                              <span className="font-black text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Prescription / Action Plan</span>
                              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">{diagnosis.recommendation}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadDiagnosisReport(diagnosis);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer font-bold"
                          >
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                            View PDF Report
                          </button>
                          <Link 
                            href={`/diagnosis/result?id=${diagnosis.id}`} 
                            onClick={() => {
                              sessionStorage.setItem('diagnosis_report', JSON.stringify({
                                id: diagnosis.id,
                                cropType: diagnosis.crop_type,
                                diseaseName: diagnosis.result_label || 'Healthy Leaf',
                                status: diagnosis.status,
                                confidence: diagnosis.confidence,
                                recommendations: diagnosis.recommendation || 'Detailed insights of KamerFresh diagnostic.',
                                scientificName: 'Sourced from local scan database',
                                symptoms: [],
                                treatmentSteps: [],
                                causes: [],
                                preventions: []
                              }));
                              sessionStorage.setItem('diagnosis_image', diagnosis.image_url);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Full Details
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No diagnoses recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('my_inventory')}</h3>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {myProducts.length} 
                </span>
              </div>
              <Link href="/listings" className="text-slate-400 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                {t('manage_all')}
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
            <div className="space-y-4">
              {myProducts.length > 0 ? (
                myProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <ResponsiveImage 
                        src={product.image_url || 'https://picsum.photos/seed/product/100/100'} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        baseWidth={100}
                        baseHeight={100}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm dark:text-white truncate">{product.name}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          product.stock_quantity > 50 ? 'bg-green-100 text-green-600' :
                          product.stock_quantity > 10 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {product.stock_quantity} {product.unit} left
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{product.price.toLocaleString()} FCFA / {product.unit}</p>
                    </div>
                    <Link href={`/marketplace`} className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">edit</Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No products listed yet.</p>
                  <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline mt-2 inline-block">Go to Marketplace to add products</Link>
                </div>
              )}
            </div>
          </div>

          {/* Market Demand Index for Cameroon Sourcing */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-primary">analytics</span>
                  MARKET DEMAND INDEX
                </h3>
                <p className="text-[10px] text-slate-500 font-medium font-bold">What Cameroonian wholesalers and buyers are actively seeking</p>
              </div>
              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/15 leading-none">HIGH DEMAND</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              {[
                { crop: 'Penja White Pepper', target: 'Douala / Export', demand: '98%', trend: '+8.4%', up: true, desc: 'Grade A Sun-Dried' },
                { crop: 'Yellow Maize', target: 'Bafoussam Feeds', demand: '92%', trend: '+14.2%', up: true, desc: 'Dry Bulk Shelled' },
                { crop: 'Mbe Yam Tubers', target: 'Yaoundé Mfoundi', demand: '81%', trend: '-2.1%', up: false, desc: 'Large Tubers preferred' },
                { crop: 'Organic Avocado', target: 'Mbouda Sourcing', demand: '74%', trend: '+5.0%', up: true, desc: 'Fuerte & Butter varieties' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1 hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 truncate">{item.target}</span>
                    <span className={`text-[8px] font-black ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>{item.trend}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1 leading-tight tracking-tight">{item.crop}</h4>
                  <p className="text-[9px] text-slate-500 truncate">{item.desc}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: item.demand }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{item.demand}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">{t('recent_activity')}</h3>
            <div className="space-y-6">
              {recentActivities.map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center ${item.color}`}>
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm dark:text-white">{item.title}</h4>
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6 sm:space-y-8">
          <div className="bg-background-dark text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <h3 className="text-lg sm:text-xl font-bold mb-6 relative z-10 text-left">{t('weather_forecast')}</h3>
            {weatherLoading ? (
              <div className="animate-pulse space-y-4 relative z-10">
                <div className="h-10 w-24 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-32 bg-white/10 rounded-lg"></div>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-between mb-8 relative z-10 text-left">
                  <div>
                    <p className="text-3xl sm:text-4xl font-black">{weather.temp}°C</p>
                    <p className="text-xs sm:text-sm text-slate-400 capitalize">
                      {weather.description}, {weather.rain ? `${weather.rain}mm rain` : 'No Rain'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{weather.city}</p>
                  </div>
                  {weather.icon && (
                    <Image 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                      alt={weather.description}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10 mb-8 text-left">
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-blue-400">water_drop</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('humidity')}</p>
                      <p className="text-sm font-black">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-400">air</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('wind')}</p>
                      <p className="text-sm font-black">{weather.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>

                {forecast && (
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 text-left">{t('hourly_temp')} (°C)</p>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast.hourly}>
                            <defs>
                              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="temp" stroke="#fbbf24" fillOpacity={1} fill="url(#colorTemp)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 text-left">{t('precip')} (mm)</p>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={forecast.daily}>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe Spraying and Smart Harvest window */}
                <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border text-left ${
                  (weather.rain || weather.humidity > 80)
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}>
                  <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                    {(weather.rain || weather.humidity > 80) ? 'warning' : 'task_alt'}
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {(weather.rain || weather.humidity > 80) ? 'PRESP_CROP WARNING' : 'SAFE SPRAY WINDOW'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
                      {(weather.rain || weather.humidity > 80) 
                        ? 'High rainfall or humidity risks washing organic treatment spray off cocoa fields or potato plants. Postpone active applications.' 
                        : 'Optimal humidity levels with zero short-term rain forecast. Ideal to dispatch nutrient spray and execute scans.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 relative z-10 text-left">Weather data unavailable. Please enable location access.</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">{t('active_categories')}</h3>
            <div className="space-y-4">
              {myProducts.length > 0 ? Array.from(new Set(myProducts.map(p => p.category))).slice(0, 3).map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs sm:text-sm font-bold mb-2 dark:text-slate-300">
                    <span>{cat}</span>
                    <span className="text-slate-400 dark:text-slate-500">{Math.round((myProducts.filter(p => p.category === cat).length / myProducts.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(myProducts.filter(p => p.category === cat).length / myProducts.length) * 100}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500">No category data available.</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
