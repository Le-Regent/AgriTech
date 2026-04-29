'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { OfflineProvider } from '@/context/OfflineContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import SyncManager from '@/components/features/sync/SyncManager';
import { RoleSelectionGuard } from '@/components/auth/RoleSelectionGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <RoleSelectionGuard>
            <OfflineProvider>
              <NotificationProvider>
                <CartProvider>
                  <SyncManager />
                  {children}
                </CartProvider>
              </NotificationProvider>
            </OfflineProvider>
          </RoleSelectionGuard>
        </UserProvider>
      </LanguageProvider>
  </ThemeProvider>
  );
}
