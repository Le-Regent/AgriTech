'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Terminal, 
  User, 
  Activity, 
  Shield, 
  AlertCircle,
  Clock,
  RefreshCcw,
  Zap,
  Globe,
  Database
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getAuditLogs();
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('REVOKE')) return 'bg-red-100 text-red-600';
    if (action.includes('VERIFY') || action.includes('APPROVE') || action.includes('RESOLVE')) return 'bg-green-100 text-green-600';
    if (action.includes('STATUS')) return 'bg-blue-100 text-blue-600';
    return 'bg-slate-100 text-slate-600';
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Audit Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Immutable Ledger of Administrative Actions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search logs, actions, or admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64 md:w-80 shadow-sm"
            />
          </div>
          <button 
            onClick={loadLogs}
            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, icon: Database, color: 'bg-blue-50 text-blue-600' },
          { label: 'Critical Actions', value: logs.filter(l => l.action.includes('DELETE') || l.action.includes('EMERGENCY')).length, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
          { label: 'Active Admins', value: new Set(logs.map(l => l.user_id)).size, icon: Shield, color: 'bg-purple-50 text-purple-600' },
          { label: 'System Health', value: 'OPTIMAL', icon: Activity, color: 'bg-green-50 text-green-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Logs Registry */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administrator</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action Protocol</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Context & Details</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-10 bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Terminal size={48} className="text-slate-200" />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Audit Cache Empty</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                          <User size={14} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                          {log.profiles?.full_name || 'System Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.details}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.id.slice(0, 8)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center gap-2 justify-center py-4 opacity-50">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Telemetry Synchronized</span>
      </div>
    </div>
  );
}
