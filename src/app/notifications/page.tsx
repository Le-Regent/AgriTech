'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabaseService } from '@/services/supabaseService';
import { AppNotification, NotificationCategory } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Bell, 
  ShoppingBag, 
  TrendingUp, 
  CloudSun, 
  Package, 
  Settings, 
  Info,
  BellOff
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await supabaseService.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => supabaseService.markNotificationAsRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return <Bell size={24} />;
      case 'proposition': return <ShoppingBag size={24} />;
      case 'market': return <TrendingUp size={24} />;
      case 'climate': return <CloudSun size={24} />;
      case 'order': return <Package size={24} />;
      case 'system': return <Settings size={24} />;
      default: return <Info size={24} />;
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
      case 'proposition': return 'text-primary bg-primary/10';
      case 'market': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      case 'climate': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase">{t('notifications')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            {t('activity_center')}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={markAllAsRead}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-white"
          >
            {t('mark_all_read')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {(['all', 'primary', 'proposition', 'market', 'climate'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-900 text-white shadow-xl scale-105' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white/50 dark:bg-slate-900/50'
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loading_alerts')}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <BellOff size={40} className="text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-black dark:text-white">{t('all_caught_up')}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('no_alerts')} in {t(activeTab)}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((n) => (
                <motion.div 
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-6 sm:p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors flex gap-6 ${!n.is_read ? 'bg-primary/[0.01]' : ''}`}
                >
                  <div className={`w-14 h-14 shrink-0 rounded-3xl flex items-center justify-center ${getCategoryColor(n.category)} shadow-sm`}>
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className={`text-lg font-black dark:text-white leading-tight ${!n.is_read ? 'text-primary' : ''}`}>
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                            {format(new Date(n.created_at), 'MMMM dd, yyyy • HH:mm')}
                          </span>
                          {!n.is_read && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em]">New</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                      {n.link && (
                        <Link 
                          href={n.link}
                          onClick={() => markAsRead(n.id)}
                          className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          {t('view_details')}
                        </Link>
                      )}
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
