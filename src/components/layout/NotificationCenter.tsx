'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '@/services/supabaseService';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import { AppNotification, NotificationCategory } from '@/types';
import { format } from 'date-fns';

export function NotificationCenter() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('primary');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const displayedNotifications = activeTab === 'all' 
    ? filteredNotifications 
    : filteredNotifications.slice(0, 5);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return 'notifications_active';
      case 'proposition': return 'local_mall';
      case 'market': return 'trending_up';
      case 'climate': return 'partly_cloudy_day';
      case 'order': return 'package_2';
      case 'system': return 'settings';
      default: return 'info';
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
      case 'proposition': return 'text-primary bg-primary/10';
      case 'market': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      case 'climate': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      case 'order': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10';
      case 'system': return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-surface-hover-dark flex items-center justify-center text-slate-500 dark:text-slate-400 relative transition-all group"
        title="Notifications"
      >
        <span className={`material-symbols-outlined text-[24px] ${unreadCount > 0 ? 'animate-wiggle' : ''} group-hover:scale-110 transition-transform`}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-4 w-[380px] bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-border-dark overflow-hidden z-[60]"
          >
            {/* Header */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">{t('activity_center')}</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    {t('mark_all_read')}
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-border-dark overflow-x-auto no-scrollbar">
                {(['primary', 'proposition', 'market', 'climate', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-none py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {t(tab)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loading_alerts')}</p>
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black dark:text-white">{t('all_caught_up')}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('no_alerts')} ({t(activeTab)})</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {displayedNotifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${getCategoryColor(n.category)}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {getCategoryIcon(n.category)}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-xs font-black dark:text-white leading-tight ${!n.is_read ? 'pr-2' : ''}`}>
                              {n.title}
                            </h4>
                            {!n.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {format(new Date(n.created_at), 'MMM dd, HH:mm')}
                            </span>
                            <div className="flex items-center gap-3">
                              {n.link && (
                                <Link 
                                  href={n.link}
                                  onClick={() => {
                                    markAsRead(n.id);
                                    setIsOpen(false);
                                  }}
                                  className="text-[9px] font-black uppercase tracking-[0.1em] text-primary hover:underline"
                                >
                                  {t('view_details')}
                                </Link>
                              )}
                              {!n.is_read && (
                                <button 
                                  onClick={() => markAsRead(n.id)}
                                  className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-600"
                                >
                                  {t('mark_all_read').split(' ')[0]} {/* Simple "Mark" or "Marquer" */}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {displayedNotifications.length > 0 && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-border-dark text-center">
                <button 
                  onClick={() => {
                    setActiveTab('all');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {activeTab === 'all' ? t('scroll_more') : t('view_background')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
