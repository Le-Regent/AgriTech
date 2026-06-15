'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  Tractor, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  BadgeCheck,
  RefreshCcw,
  Smartphone
} from 'lucide-react';

export default function AdminVerificationPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getAllProfiles();
      setFarmers((data || []).filter(p => p.user_type === 'farmer'));
    } catch (error) {
      console.error('Error loading farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await supabaseService.updateProfile(userId, { is_verified: !currentStatus });
      
      // Log action
      const myProfile = await supabaseService.getProfile((await (await fetch('/api/auth/me')).json()).id);
      await supabaseService.logAdminAction(myProfile.id, 'FARMER_KYC', `${!currentStatus ? 'Verified' : 'Unverified'} farmer account ${userId}`, userId);
      
      setFarmers(farmers.map(f => f.id === userId ? { ...f, is_verified: !currentStatus } : f));
    } catch (error) {
      console.error('Error verifying farmer:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFarmers = farmers.filter(f => {
    if (filter === 'pending') return !f.is_verified;
    if (filter === 'verified') return f.is_verified;
    return true;
  });

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Farmer Verification Desk</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">KYC & Identity Authentication Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
          >
            <option value="pending">Awaiting Vetting</option>
            <option value="verified">Authorized Farmers</option>
            <option value="all">Every Profile</option>
          </select>
          <button 
            onClick={loadFarmers}
            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border border-slate-100 dark:border-white/5 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCheck className="text-slate-300 dark:text-primary/30" size={40} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Verification Queue Empty</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">All recent farmer registrations have been vetted and authenticated against the platform protocol.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer, idx) => (
            <motion.div
              key={farmer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/10 shrink-0">
                    <img 
                      src={farmer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${farmer.full_name}`} 
                      alt={farmer.full_name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`p-2 rounded-xl ${farmer.is_verified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {farmer.is_verified ? <BadgeCheck size={20} /> : <AlertCircle size={20} />}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1 group-hover:text-primary transition-colors">
                  {farmer.full_name}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-6">
                  <Tractor size={12} /> {farmer.farm_name || 'Generic Farm Account'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Smartphone size={14} />
                    <span className="text-xs font-bold">{farmer.phone_number || 'No MoMo ID Registered'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <MapPin size={14} />
                    <span className="text-xs font-bold">{farmer.location_name || 'Cameroon'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">Joined {new Date(farmer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex gap-2">
                <button 
                  onClick={() => handleVerify(farmer.id, farmer.is_verified)}
                  disabled={updatingId === farmer.id}
                  className={`flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                    farmer.is_verified 
                      ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100' 
                      : 'bg-green-600 text-white shadow-lg shadow-green-600/20 hover:scale-[1.02]'
                  } disabled:opacity-50`}
                >
                  {updatingId === farmer.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : farmer.is_verified ? (
                    <><XCircle size={14} /> Revoke Authorization</>
                  ) : (
                    <><CheckCircle size={14} /> Verify & Access Market</>
                  )}
                </button>
                <button className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                  <FileText size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
