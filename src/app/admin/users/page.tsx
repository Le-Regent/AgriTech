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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage {users.length} registered platform members</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 outline-none w-full sm:w-64"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mr-3">
                        <img 
                          src={u.avatar_url || `https://picsum.photos/seed/${u.id}/40/40`} 
                          alt={u.full_name} 
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                          {u.full_name}
                          {u.is_admin && <ShieldCheck size={14} className="ml-1.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                          <Mail size={10} className="mr-1" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      u.user_type === 'farmer' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      {u.user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center">
                      <Calendar size={14} className="mr-1.5 opacity-50" />
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleTimeString() : 'Recently'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_verified ? (
                      <div className="flex items-center text-green-600 dark:text-green-400 text-xs font-bold">
                        <ShieldCheck size={14} className="mr-1" />
                        Verified
                      </div>
                    ) : (
                      <div className="flex items-center text-slate-400 text-xs font-medium">
                        Unverified
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleAdmin(u.id, !!u.is_admin)}
                      disabled={updatingId === u.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        u.is_admin 
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400'
                      } disabled:opacity-50`}
                      title={u.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                    >
                      {updatingId === u.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">
                          {u.is_admin ? 'shield_person' : 'person_add'}
                        </span>
                      )}
                      {u.is_admin ? 'Revoke' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
