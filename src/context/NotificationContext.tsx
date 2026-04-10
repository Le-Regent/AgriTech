import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      ...n,
      id,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss after 5 minutes (300000ms)
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300000);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Simulate real-time price trend notifications
  useEffect(() => {
    const trends = [
      { title: 'Price Drop!', message: 'Potato prices in your area dropped by 15% today.', type: 'success' as const },
      { title: 'Market Alert', message: 'High demand for organic tomatoes detected in the central market.', type: 'info' as const },
      { title: 'Weather Warning', message: 'Heavy rain expected tomorrow. Protect your harvest.', type: 'warning' as const },
    ];

    // Initial notification after 30 minutes
    const interval = setInterval(() => {
      const trend = trends[Math.floor(Math.random() * trends.length)];
      addNotification(trend);
    }, 1800000); // Every 30 minutes

    return () => clearInterval(interval);
  }, [addNotification]);

  const value = useMemo(() => ({
    notifications,
    addNotification,
    markAsRead,
    clearAll
  }), [notifications, addNotification, markAsRead, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {notifications.filter(n => !n.isRead).slice(0, 3).map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl pointer-events-auto flex gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                n.type === 'success' ? 'bg-green-100 text-green-600' :
                n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                n.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <span className="material-symbols-outlined">
                  {n.type === 'success' ? 'trending_down' :
                   n.type === 'warning' ? 'warning' :
                   n.type === 'error' ? 'error' :
                   'info'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm dark:text-white">{n.title}</h4>
                  <button onClick={() => markAsRead(n.id)} className="text-slate-300 hover:text-slate-500">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
