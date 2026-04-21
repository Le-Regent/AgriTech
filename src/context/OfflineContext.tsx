import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

interface SyncAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface OfflineContextType {
  isOnline: boolean;
  saveToCache: (key: string, data: any) => void;
  getFromCache: (key: string) => any;
  addToSyncQueue: (type: string, data: any) => void;
  syncQueue: SyncAction[];
  clearSyncQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const saved = localStorage.getItem('agritech_sync_queue');
      if (saved) {
        try {
          setSyncQueue(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse sync queue from localStorage:', e);
        }
      }

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agritech_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const saveToCache = useCallback((key: string, data: any) => {
    try {
      const stringifiedData = JSON.stringify(data);
      // localStorage usually has a limit of 5-10MB. 
      // If a single item is > 2MB, it's very risky for our app context.
      if (stringifiedData.length > 2 * 1024 * 1024) {
        console.warn(`Data for key ${key} is too large (${(stringifiedData.length / 1024 / 1024).toFixed(2)}MB), skipping cache.`);
        return;
      }
      localStorage.setItem(`agritech_cache_${key}`, stringifiedData);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014) {
        console.warn('Cache quota exceeded, clearing old cache entries...');
        
        // Clear all cached data (those starting with agritech_cache_)
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('agritech_cache_')) {
            localStorage.removeItem(k);
          }
        });
        
        // Also clear other non-essential data if needed, but start with our cache
        try {
          const stringifiedData = JSON.stringify(data);
          localStorage.setItem(`agritech_cache_${key}`, stringifiedData);
        } catch (retryError) {
          console.error('Failed to save to cache even after clearing:', retryError);
          // If it still fails, it might be a single huge item or other non-removable data.
          // We don't throw to avoid crashing the UI.
        }
      } else {
        console.error('Failed to save to cache', e);
      }
    }
  }, []);

  const getFromCache = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(`agritech_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get from cache', e);
      return null;
    }
  }, []);

  const addToSyncQueue = useCallback((type: string, data: any) => {
    const newAction: SyncAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now(),
    };
    setSyncQueue(prev => [...prev, newAction]);
  }, []);

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
  }, []);

  const value = useMemo(() => ({
    isOnline,
    saveToCache,
    getFromCache,
    addToSyncQueue,
    syncQueue,
    clearSyncQueue
  }), [isOnline, saveToCache, getFromCache, addToSyncQueue, syncQueue, clearSyncQueue]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
