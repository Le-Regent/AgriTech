'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '@/services/supabaseService';
import { useUser } from '@/context/UserContext';
import { AppNotification, NotificationCategory } from '@/types';
import { format } from 'date-fns';

export function NotificationCenter() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('primary');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await supabaseService.getNotifications(user.id);
      setNotifications(data);
      setUnreadCount(data.filter((n: AppNotification) => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling for new notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => supabaseService.markNotificationAsRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  // Smart limitation: Show most recent, but keep rest in "background" (available via 'all')
  const displayedNotifications = activeTab === 'all' 
    ? filteredNotifications 
    : filteredNotifications.slice(0, 5);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return 'notifications_active';
      case 'proposition': return 'local_mall';
      case 'insight': return 'analytics';
      default: return 'info';
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'primary': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
      case 'proposition': return 'text-primary bg-primary/10';
      case 'insight': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
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
                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Activity Center</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-border-dark">
                {(['primary', 'proposition', 'insight', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Alerts...</p>
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black dark:text-white">All caught up!</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No {activeTab} alerts found</p>
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
                                  View Details
                                </Link>
                              )}
                              {!n.is_read && (
                                <button 
                                  onClick={() => markAsRead(n.id)}
                                  className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-600"
                                >
                                  Mark Read
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
                  {activeTab === 'all' ? 'Scroll to see more' : 'View background notifications'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
