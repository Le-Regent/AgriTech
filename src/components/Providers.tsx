'use client';

import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProvider } from '../context/UserContext';
import { OfflineProvider } from '../context/OfflineContext';
import { CartProvider } from '../context/CartContext';
import SyncManager from './SyncManager';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <OfflineProvider>
          <CartProvider>
            <SyncManager />
            {children}
          </CartProvider>
        </OfflineProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
