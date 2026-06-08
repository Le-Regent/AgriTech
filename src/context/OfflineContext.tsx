import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { get, set, del, keys } from 'idb-keyval';

interface SyncAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface OfflineContextType {
  isOnline: boolean;
  saveToCache: (key: string, data: any, debounce?: boolean) => Promise<void>;
  getFromCache: (key: string) => Promise<any>;
  addToSyncQueue: (type: string, data: any) => void;
  syncQueue: SyncAction[];
  clearSyncQueue: () => void;
  getOrFetch: <T>(key: string, fetcher: () => Promise<T>) => Promise<T>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      // Load sync queue from IndexedDB
      get('agritech_sync_queue').then(saved => {
        if (saved) {
          try {
            setSyncQueue(saved);
          } catch (e) {
            console.error('Failed to parse sync queue from IndexedDB:', e);
          }
        }
      });

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
    set('agritech_sync_queue', syncQueue);
  }, [syncQueue]);

  const writeQueueRef = useRef<Record<string, any>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const processCacheWrites = useCallback(async () => {
    const queue = { ...writeQueueRef.current };
    writeQueueRef.current = {};
    timerRef.current = null;
    
    for (const [key, val] of Object.entries(queue)) {
      try {
        await set(`cache_${key}`, val);
      } catch (err) {
        console.error('Debounced cache write failed for key:', key, err);
      }
    }
  }, []);

  const saveToCache = useCallback(async (key: string, data: any, debounce = false) => {
    if (debounce) {
      writeQueueRef.current[key] = data;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(processCacheWrites, 400);
      return;
    }

    try {
      await set(`cache_${key}`, data);
    } catch (e) {
      console.error('Failed to save to cache', e);
    }
  }, [processCacheWrites]);

  const getFromCache = useCallback(async (key: string) => {
    try {
      return await get(`cache_${key}`);
    } catch (e) {
      console.error('Failed to get from cache', e);
      return null;
    }
  }, []);

  /**
   * High-performance data fetcher for slow internet.
   * Returns cached data immediately if available, then updates with fresh data.
   */
  const getOrFetch = useCallback(async <T,>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    // 1. Try to get from cache first for immediate UI update
    const cached = await get(`cache_${key}`);
    
    // 2. Fetch fresh data in the background (or immediately if not cached)
    if (navigator.onLine) {
      try {
        const fresh = await fetcher();
        await set(`cache_${key}`, fresh);
        return fresh;
      } catch (e) {
        console.warn(`Fetch failed for ${key}, falling back to cache.`, e);
        if (cached) return cached;
        throw e;
      }
    }
    
    if (cached) return cached;
    throw new Error('Offline and no cached data available.');
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
    clearSyncQueue,
    getOrFetch
  }), [isOnline, saveToCache, getFromCache, addToSyncQueue, syncQueue, clearSyncQueue, getOrFetch]);

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
