import React, { useEffect } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { useCart } from '@/context/CartContext';

export default function SyncManager() {
  const { isOnline, syncQueue, clearSyncQueue } = useOffline();
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      console.log('Syncing offline actions...', syncQueue);
      
      // Process each action in the queue
      syncQueue.forEach(action => {
        switch (action.type) {
          case 'ADD_TO_CART':
            // In a real app, this would be an API call
            // For this demo, we can just log it or re-apply it if needed
            // But cart is already updated locally, so we just sync with server
            console.log('Syncing cart update:', action.data);
            break;
          case 'ADD_REVIEW':
            // Sync review with server
            console.log('Syncing new review:', action.data);
            break;
          default:
            console.warn('Unknown sync action type:', action.type);
        }
      });

      // Clear the queue after successful sync
      // In a real app, you'd only clear after API success
      const timer = setTimeout(() => {
        clearSyncQueue();
        console.log('Sync complete!');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncQueue, clearSyncQueue]);

  return null; // This component doesn't render anything
}
