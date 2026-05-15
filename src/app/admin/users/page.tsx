'use client';

import React, { useEffect, useState } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShieldCheck, Mail, Calendar, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User } from '@/types';
import { toast } from 'sonner';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await supabaseService.getAllProfiles();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await supabaseService.toggleUserAdminStatus(userId, currentStatus);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
      toast.success(`User admin privileges ${!currentStatus ? 'granted' : 'revoked'}`);
    } catch (error) {
      toast.error('Failed to update admin status');
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const farmersCount = users.filter(u => u.user_type === 'farmer').length;
  const buyersCount = users.filter(u => u.user_type === 'buyer').length;
  const verifiedCount = users.filter(u => u.is_verified).length;

  const userStats = [
    { label: 'Total Members', value: users.length, icon: UserIcon, color: 'text-slate-600 bg-slate-100', trend: '+14' },
    { label: 'Farmers', value: farmersCount, icon: UserIcon, color: 'text-blue-600 bg-blue-100', trend: '+3' },
    { label: 'Buyers', value: buyersCount, icon: UserIcon, color: 'text-indigo-600 bg-indigo-100', trend: '+11' },
    { label: 'Verified', value: verifiedCount, icon: ShieldCheck, color: 'text-green-600 bg-green-100', trend: '82%' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Directory</h1>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Identity & Permission Management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH IDENTITY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-72 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* User Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                <div className="w-10 h-3 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
              </div>
              <div className="w-16 h-2 bg-slate-100 dark:bg-white/5 rounded-full mb-2 animate-pulse" />
              <div className="w-24 h-6 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))
        ) : (
          userStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.color} dark:bg-opacity-20`}>
                  <stat.icon size={18} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Identity Profile</th>
                <th className="px-8 py-5">Sectors</th>
                <th className="px-8 py-5">Timeline</th>
                <th className="px-8 py-5">Trust Level</th>
                <th className="px-8 py-5 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 dark:bg-white/5 animate-pulse" />
                         <div className="space-y-2">
                           <div className="w-32 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                           <div className="w-24 h-2 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                         </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="w-16 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-md" />
                    </td>
                    <td className="px-8 py-6">
                       <div className="w-24 h-4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                    </td>
                    <td className="px-8 py-6">
                       <div className="w-32 h-3 bg-slate-100 dark:bg-white/5 animate-pulse rounded-full" />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                         <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />
                         <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/10">
                            <img 
                              src={u.avatar_url || `https://picsum.photos/seed/${u.id}/48/48`} 
                              alt={u.full_name} 
                              className="w-full h-full object-cover grayscale group-hover/avatar:grayscale-0 transition-all duration-500"
                            />
                          </div>
                          {u.is_admin && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg transform rotate-12">
                              <ShieldCheck size={14} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                            {u.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">fingerprint</span>
                            {u.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          u.user_type === 'farmer' 
                            ? 'bg-blue-500/10 text-blue-500' 
                            : 'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {u.user_type}
                        </span>
                        <p className="text-[9px] text-slate-400 italic">Global Logistics Access</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-600 dark:text-white">Registered</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden`}>
                          <div 
                            className={`h-full ${u.is_verified ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`} 
                            style={{ width: u.is_verified ? '100%' : '20%' }}
                          />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${u.is_verified ? 'text-primary' : 'text-slate-400'}`}>
                          {u.is_verified ? 'Verified' : 'Low Trust'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => handleToggleAdmin(u.id, !!u.is_admin)}
                          disabled={updatingId === u.id}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            u.is_admin 
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-amber-500 hover:text-white'
                          } disabled:opacity-50`}
                          title={u.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                        >
                          {updatingId === u.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">
                              {u.is_admin ? 'security' : 'shield'}
                            </span>
                          )}
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-[20px]">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
             End of Directory Access · {filteredUsers.length} Records Visualized
           </p>
        </div>
      </div>
    </div>
  );
}
