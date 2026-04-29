'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import { useOffline } from '@/context/OfflineContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import LiveMap from '@/components/ui/LiveMap';
import { format } from 'date-fns';

const TRACKING_STEPS = [
  { status: 'processing', label: 'Processing', icon: 'inventory_2', color: 'blue' },
  { status: 'shipped', label: 'Shipped', icon: 'local_shipping', color: 'amber' },
  { status: 'delivered', label: 'Delivered', icon: 'verified', color: 'green' }
];

function LogisticsContent() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { isOnline, saveToCache, getFromCache } = useOffline();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchShipments = useCallback(async (showLoading = true) => {
    if (!user) return;
    
    const cacheKey = `shipments_${user.id}_${user.role}`;
    const cached = await getFromCache(cacheKey);
    if (cached) {
      setShipments(cached);
      setLoading(false);
    } else if (showLoading) {
      setLoading(true);
    }

    try {
      if (isOnline) {
        const shipmentsData = await supabaseService.getShipments(user.id, user.role === 'farmer' ? 'farmer' : 'buyer');
        setShipments(shipmentsData);
        saveToCache(cacheKey, shipmentsData);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getFromCache, saveToCache]);

  useEffect(() => {
    fetchShipments();

    // Real-time listener for orders
    if (user?.id) {
      const channel = supabase
        .channel(`logistics-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, () => {
          fetchShipments(false);
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchShipments, user?.id]);

  const filteredShipments = useMemo(() => {
    if (filter === 'all') return shipments;
    if (filter === 'active') return shipments.filter(s => s.status !== 'delivered');
    return shipments.filter(s => s.status === 'delivered');
  }, [shipments, filter]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const active = shipments.filter(s => s.status !== 'delivered').length;
    const completed = shipments.filter(s => s.status === 'delivered').length;
    return { total, active, completed };
  }, [shipments]);

  if (loading && !shipments.length) {
    return (
      <div className="space-y-8">
        <div className="h-20 w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-[2.5rem] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-[2.5rem] animate-pulse" />
            <div className="h-48 bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-[2.5rem] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
            {t('logistics')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Real-time supply chain monitoring 🇨🇲</p>
        </div>
        
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredShipments.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-dark p-16 rounded-[3rem] border border-slate-100 dark:border-border-dark text-center space-y-6 transition-colors"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                  <span className="material-symbols-outlined text-5xl">package_2</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black dark:text-white">Empty Logistics Hub</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-bold font-mono text-[10px] uppercase tracking-widest leading-relaxed">You don&apos;t have any {filter === 'all' ? '' : filter} shipments at the moment.</p>
                </div>
              </motion.div>
            ) : (
              filteredShipments.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-3xl">package_2</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-lg dark:text-white uppercase tracking-tight">#{shipment.id.slice(0, 8)}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            shipment.status === 'delivered' ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                            shipment.status === 'shipped' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                            'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                            {shipment.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest font-mono">
                          Created {format(new Date(shipment.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('destination')}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {shipment.shipping_address || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="relative py-8">
                    <div className="absolute top-[50px] left-0 w-full h-[6px] bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <motion.div 
                      className="absolute top-[50px] left-0 h-[6px] bg-primary rounded-full z-10"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: shipment.status === 'delivered' ? '100.2%' : 
                               shipment.status === 'shipped' ? '50%' : '12%' 
                      }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                    />
                    
                      <div className="flex justify-between items-center relative gap-4">
                      {TRACKING_STEPS.map((step, i) => {
                        const isActive = 
                          (i === 0) || 
                          (i === 1 && (shipment.status === 'shipped' || shipment.status === 'delivered')) ||
                          (i === 2 && shipment.status === 'delivered');
                        
                        return (
                          <div key={step.status} className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-20 transition-all duration-500 ${
                              isActive 
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-white dark:ring-surface-dark' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              <span className="material-symbols-outlined text-lg">
                                {isActive ? 'check' : step.icon}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`text-[10px] font-black uppercase tracking-widest block ${
                                isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                              }`}>
                                {t(step.status)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('courier')}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-primary">local_shipping</span>
                        </div>
                        <p className="font-bold text-xs dark:text-white">AgriLogistics CM</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('est_arrival')}</p>
                      <p className="font-bold text-xs dark:text-white font-mono">{shipment.status === 'delivered' ? t('completed') : '2-3 Working Days'}</p>
                    </div>
                    <div className="flex items-center justify-end">
                      <button className="bg-primary/5 hover:bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        {t('details')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-8">
          {/* Map Card */}
          <div className="bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group transition-colors">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-colors"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">{t('live_tracking')}</h3>
                <span className="bg-primary/20 text-primary-light px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Live</span>
              </div>
              
              <div className="aspect-square bg-slate-900 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center relative group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                <LiveMap 
                  center={[3.8480, 11.5021]} 
                  zoom={12}
                  className="h-full w-full opacity-60"
                  markers={[
                    { position: [3.8480, 11.5021], title: 'Fleet A-1', description: 'En route to Yaoundé' },
                    { position: [3.8600, 11.5200], title: 'Fleet B-4', description: 'Loading at Hub' }
                  ]}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent z-[400] pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90 font-mono">GPS ACTIVE: {user?.location_name || 'Yaoundé, CM'}</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-primary/30 transition-all shadow-xl shadow-primary/10 uppercase tracking-widest">
                {t('explore_map')}
              </button>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white dark:bg-surface-dark p-8 rounded-[3rem] border border-slate-100 dark:border-border-dark shadow-sm space-y-8 transition-colors">
            <h3 className="text-xl font-black tracking-tight dark:text-white">{t('delivery_stats')}</h3>
            
            <div className="space-y-6">
              {[
                { label: 'on_time_rate', value: '98.5%', color: 'text-emerald-500', icon: 'timer' },
                { label: 'transit_time', value: '1.4 Days', color: 'text-primary', icon: 'speed' },
                { label: 'efficiency', value: 'High', color: 'text-sky-500', icon: 'trending_up' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(stat.label)}</span>
                  </div>
                  <span className={`text-sm font-black ${stat.color} font-mono uppercase`}>{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span>{t('monthly_summary')}</span>
                <span className="font-mono">{stats.total} {t('items')}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }} />
                <div className="h-full bg-emerald-500" style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }} />
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('active')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('completed')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsPage() {
  return (
    <ProtectedRoute>
      <LogisticsContent />
    </ProtectedRoute>
  );
}
