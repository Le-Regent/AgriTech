'use client';

import React from 'react';
import { motion } from 'motion/react';
import ProtectedRoute from '../components/ProtectedRoute';

const shipments = [
  { id: 'SHP-1024', destination: 'Nairobi, KE', status: 'In Transit', ETA: '2024-03-28', carrier: 'FastTrack Logistics' },
  { id: 'SHP-1025', destination: 'Mombasa, KE', status: 'Pending Pickup', ETA: '2024-03-30', carrier: 'Coastal Express' },
  { id: 'SHP-1026', destination: 'Kisumu, KE', status: 'Delivered', ETA: '2024-03-25', carrier: 'Lake Region Carriers' },
  { id: 'SHP-1027', destination: 'Nakuru, KE', status: 'In Transit', ETA: '2024-03-27', carrier: 'Rift Valley Transporters' },
];

function LogisticsContent() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight dark:text-white">Logistics & Supply Chain</h2>
        <p className="text-slate-500 dark:text-slate-400">Track shipments, manage deliveries, and optimize your farm&apos;s reach.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Shipments', value: '4', icon: 'local_shipping', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending Pickups', value: '2', icon: 'pending_actions', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Delivered (MTD)', value: '12', icon: 'task_alt', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Avg. Delivery Time', value: '2.4 Days', icon: 'timer', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-6`}>
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-black dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black dark:text-white">Active Shipments</h3>
          <button className="text-primary font-black text-sm flex items-center gap-2">
            View All
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipment ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ETA</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {shipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold dark:text-white">{shp.id}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400">{shp.destination}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      shp.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      shp.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {shp.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400">{shp.ETA}</td>
                  <td className="px-8 py-5 text-sm font-bold dark:text-white">{shp.carrier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-12 transition-colors">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-6xl">map</span>
        </div>
        <div className="space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-black dark:text-white">Global Logistics Network</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Connect with verified logistics partners to ship your produce globally. Track every mile from your farm to the buyer&apos;s doorstep with real-time GPS tracking and temperature-controlled monitoring.
          </p>
          <button className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all">
            Find New Partners
          </button>
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
