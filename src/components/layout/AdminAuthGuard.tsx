'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, updateProfile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [elevating, setElevating] = useState(false);
  const [adminProtocolPassword, setAdminProtocolPassword] = useState(process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'kamer-admin-2024');

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    toast.info('Admin session expired.');
    router.push('/');
  }, [router]);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    
    const fetchConfig = async () => {
      if (!user?.id || !user?.is_admin) {
        setLoading(false);
        return;
      }

      try {
        // First try to get the individual password for this admin
        const personalPassword = await supabaseService.getAdminPassword(user.id);
        if (personalPassword) {
          setAdminProtocolPassword(personalPassword);
        } else {
          // Fallback to global config if no personal password set
          const dbPassword = await supabaseService.getSystemConfig('admin_protocol_password');
          if (dbPassword) {
            setAdminProtocolPassword(dbPassword);
          }
        }
      } catch (e) {
        console.error('Failed to fetch admin protocol password from DB, using fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  // Inactivity timeout logic (5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, 5 * 60 * 1000); // 5 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, handleLogout]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminProtocolPassword) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      toast.success('Admin authentication successful');
    } else {
      toast.error('Incorrect admin password');
      setPassword('');
    }
  };

  if (loading) return null;

  if (!user?.is_admin) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md mx-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-rounded text-4xl text-red-600 dark:text-red-400">lock</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You do not have the required permissions to access the admin panel.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg"
            >
              Go Back Home
            </button>
          </div>
        </div>
      );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-700"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-amber-600">security</span>
            </div>
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Admin Protocol</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Enhanced Security Layer Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Master Password</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 p-4 pl-12 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        autoFocus
                    />
                </div>
             </div>
             
             <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                >
                    Verify
                </button>
             </div>
          </form>

          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xs">info</span>
            Encrypted session expires in 5 minutes
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
