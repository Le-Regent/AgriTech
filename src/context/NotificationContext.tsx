'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { AppNotification } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessagesCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshUnreadMessages: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await supabaseService.getNotifications(user.id);
      setNotifications(data || []);
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await supabaseService.getUnreadMessagesCount(user.id);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadMessagesCount();

    if (!user) return;

    // Real-time subscription to notifications table
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast(newNotification.title, {
            description: newNotification.message,
            action: newNotification.link ? {
              label: 'View',
              onClick: () => window.location.href = newNotification.link!
            } : undefined
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as AppNotification;
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
          
          // Recalculate unread count
          setNotifications(prev => {
            const unread = prev.filter(n => !n.is_read).length;
            setUnreadCount(unread);
            return prev;
          });
        }
      )
      .subscribe();

    // Real-time messages unread subscription
    const messagesChannel = supabase
      .channel(`user_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Whenever there are inserts, updates, deletes, recalculate unread messages count
          fetchUnreadMessagesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, fetchNotifications, fetchUnreadMessagesCount]);

  const markAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id);
      // Local update handled by subscription or manually
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      unreadMessagesCount,
      loading, 
      markAsRead, 
      markAllAsRead,
      clearNotifications,
      refreshUnreadMessages: fetchUnreadMessagesCount
    }}>
      {children}
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
