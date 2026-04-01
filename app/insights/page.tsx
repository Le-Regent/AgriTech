'use client';

import React from 'react';
import { motion } from 'motion/react';
import ProtectedRoute from '../components/ProtectedRoute';

function InsightsContent() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight dark:text-white">Market Insights</h2>
        <p className="text-slate-500 dark:text-slate-400">Real-time data and trends for your agricultural products.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Price Trends', value: '+12%', icon: 'trending_up', color: 'text-emerald-500' },
          { label: 'Demand Index', value: 'High', icon: 'analytics', color: 'text-blue-500' },
          { label: 'Market Reach', value: 'Global', icon: 'public', color: 'text-violet-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-black dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <span className="material-symbols-outlined text-4xl">bar_chart</span>
        </div>
        <h3 className="text-xl font-bold mb-2 dark:text-white">Advanced Analytics</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Upgrade to the Pro Plan to unlock detailed price forecasting, competitor analysis, and seasonal demand predictions.
        </p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <InsightsContent />
    </ProtectedRoute>
  );
}
