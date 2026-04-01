'use client';

import { ThemeProvider } from '../src/context/ThemeContext';
import { UserProvider } from '../src/context/UserContext';
import { OfflineProvider } from '../src/context/OfflineContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { CartProvider } from '../src/context/CartContext';
import SyncManager from '../src/components/SyncManager';

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
