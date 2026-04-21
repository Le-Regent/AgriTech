'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

function LogisticsContent() {
  const { user } = useUser();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // For now, we use orders with 'shipped' or 'delivered' status as shipments
        const orders = await supabaseService.getOrders(user.id, user.role === 'farmer' ? 'farmer' : 'buyer');
        const shipmentsData = orders.filter((o: any) => o.status === 'shipped' || o.status === 'delivered' || o.status === 'processing');
        setShipments(shipmentsData);
      } catch (error) {
        console.error('Failed to fetch shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight dark:text-white">Logistics & Tracking</h2>
        <p className="text-slate-500 dark:text-slate-400">Track your shipments and manage delivery logistics in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {shipments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">local_shipping</span>
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">No Active Shipments</h3>
              <p className="text-slate-500 dark:text-slate-400">Once your orders are processed and shipped, they will appear here for tracking.</p>
            </div>
          ) : (
            shipments.map((shipment) => (
              <div key={shipment.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined">package_2</span>
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white">Order #{shipment.id.slice(0, 8).toUpperCase()}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{shipment.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold dark:text-white">{shipment.order_items?.[0]?.products?.name || 'Produce'}</p>
                    <p className="text-xs text-slate-500">Destination: {shipment.shipping_address || 'Douala, CM'}</p>
                  </div>
                </div>

                <div className="relative pt-2 pb-8">
                  <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div 
                    className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-1000" 
                    style={{ width: shipment.status === 'delivered' ? '100%' : shipment.status === 'shipped' ? '66%' : '33%' }}
                  />
                  
                  <div className="flex justify-between items-center relative">
                    {['Processing', 'Shipped', 'Delivered'].map((label, i) => (
                      <div key={label} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          (i === 0) || (i === 1 && (shipment.status === 'shipped' || shipment.status === 'delivered')) || (i === 2 && shipment.status === 'delivered')
                            ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {(i === 0) || (i === 1 && (shipment.status === 'shipped' || shipment.status === 'delivered')) || (i === 2 && shipment.status === 'delivered')
                              ? 'check' : 'radio_button_unchecked'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider dark:text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Carrier</p>
                    <p className="font-bold text-sm dark:text-white">Express Agri-Logistics</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Est. Arrival</p>
                    <p className="font-bold text-sm dark:text-white">2-3 Business Days</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
             <h3 className="text-xl font-bold mb-4 relative z-10">Map View</h3>
             <div className="aspect-square bg-white/10 rounded-2xl mb-6 flex items-center justify-center relative z-10 border border-white/10">
                <span className="material-symbols-outlined text-4xl opacity-50">map</span>
                <p className="absolute bottom-4 text-[10px] uppercase font-bold tracking-widest text-white/60">Live vehicle tracking</p>
             </div>
             <button className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm hover:scale-[1.02] transition-all relative z-10 shadow-lg shadow-primary/20">
               Open Live Map
             </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Delivery Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'On-Time Rate', value: '98.5%', color: 'text-green-500' },
                { label: 'Avg. Delivery', value: '1.2 Days', color: 'text-blue-500' },
                { label: 'Carrier Score', value: '4.9/5', color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <span className={`font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
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
