import React, { createContext, useContext, useState, useEffect } from 'react';

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
    setIsOnline(navigator.onLine);
    const saved = localStorage.getItem('agritech_sync_queue');
    if (saved) {
      setSyncQueue(JSON.parse(saved));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('agritech_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const saveToCache = (key: string, data: any) => {
    try {
      localStorage.setItem(`agritech_cache_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to cache', e);
    }
  };

  const getFromCache = (key: string) => {
    try {
      const data = localStorage.getItem(`agritech_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get from cache', e);
      return null;
    }
  };

  const addToSyncQueue = (type: string, data: any) => {
    const newAction: SyncAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now(),
    };
    setSyncQueue(prev => [...prev, newAction]);
  };

  const clearSyncQueue = () => {
    setSyncQueue([]);
  };

  return (
    <OfflineContext.Provider value={{ isOnline, saveToCache, getFromCache, addToSyncQueue, syncQueue, clearSyncQueue }}>
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
