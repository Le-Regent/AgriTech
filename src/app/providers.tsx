'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { OfflineProvider } from '@/context/OfflineContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { CartProvider } from '@/context/CartContext';
import SyncManager from '@/components/features/sync/SyncManager';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <OfflineProvider>
          <NotificationProvider>
            <CartProvider>
              <SyncManager />
              {children}
            </CartProvider>
          </NotificationProvider>
        </OfflineProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
