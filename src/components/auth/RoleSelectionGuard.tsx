'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'motion/react';

interface RoleSelectionGuardProps {
  children: React.ReactNode;
}

export function RoleSelectionGuard({ children }: RoleSelectionGuardProps) {
  const { user, updateProfile, loading, isAuthReady } = useUser();
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'buyer' | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agritech_role_dismissed') === 'true';
    }
    return false;
  });

  // Only show if user is logged in but has no user_type set
  // AND either they are a new user OR they haven't dismissed it this session
  const needsRole = isAuthReady && user && !user.user_type && !isDismissed;

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    try {
      const { error } = await updateProfile({ user_type: selectedRole });
      if (!error) {
        setIsDismissed(true);
        localStorage.setItem('agritech_role_dismissed', 'true');
      } else {
        console.error('Failed to set role:', error);
      }
    } catch (err) {
      console.error('Error in RoleSelectionGuard:', err);
    }
  };

  if (!isAuthReady || !needsRole) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950 font-sans overflow-hidden">
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => useUser().logout()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
      {/* Background elements */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 mx-auto mb-6 rotate-6">
            <span className="material-symbols-outlined text-3xl font-bold">person_search</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase italic mb-4">
            Identify Yourself
          </h2>
          <p className="text-slate-400 font-medium text-lg">
            How do you plan to use <span className="text-primary italic">AgriTech</span>?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setSelectedRole('farmer')}
            className={`group relative p-8 rounded-[2rem] border-2 transition-all text-left overflow-hidden ${
              selectedRole === 'farmer' 
                ? 'border-primary bg-primary/5' 
                : 'border-white/5 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
              selectedRole === 'farmer' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
            }`}>
              <span className="material-symbols-outlined text-2xl font-bold">agriculture</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">Farmer</h3>
            <p className="text-slate-500 text-sm font-medium leading-tight">
              Sell your crops, track soil health, and access AI-driven insights.
            </p>
            {selectedRole === 'farmer' && (
              <motion.div layoutId="check" className="absolute top-4 right-4 text-primary">
                <span className="material-symbols-outlined font-bold">check_circle</span>
              </motion.div>
            )}
          </button>

          <button
            onClick={() => setSelectedRole('buyer')}
            className={`group relative p-8 rounded-[2rem] border-2 transition-all text-left overflow-hidden ${
              selectedRole === 'buyer' 
                ? 'border-blue-500 bg-blue-500/5' 
                : 'border-white/5 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
              selectedRole === 'buyer' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
            }`}>
              <span className="material-symbols-outlined text-2xl font-bold">shopping_basket</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">Buyer</h3>
            <p className="text-slate-500 text-sm font-medium leading-tight">
              Browse fresh produce, connect with farmers, and manage logistics.
            </p>
            {selectedRole === 'buyer' && (
              <motion.div layoutId="check" className="absolute top-4 right-4 text-blue-500">
                <span className="material-symbols-outlined font-bold">check_circle</span>
              </motion.div>
            )}
          </button>
        </div>

        <button
          onClick={handleRoleSelect}
          disabled={!selectedRole || loading}
          className="w-full py-5 bg-gradient-to-r from-primary to-green-500 hover:to-green-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {loading ? 'Processing Identity...' : 'Confirm Identity'}
        </button>
      </motion.div>
    </div>
  );
}
