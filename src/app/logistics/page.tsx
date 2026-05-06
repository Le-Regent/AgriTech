import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import LogisticsContent from './LogisticsContent';
import { Truck } from 'lucide-react';

export default function LogisticsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header - Server Rendered for instant visibility */}
        <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight dark:text-white flex items-center gap-3">
              <Truck className="text-primary" size={32} />
              Logistics
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Real-time supply chain monitoring 🇨🇲</p>
          </div>
        </div>

        <LogisticsContent />
      </div>
    </ProtectedRoute>
  );
}
