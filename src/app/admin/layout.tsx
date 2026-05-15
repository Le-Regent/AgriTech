'use client';

import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'motion/react';

import { usePathname } from 'next/navigation';
import AdminAuthGuard from '@/components/layout/AdminAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-background-dark z-[120] lg:hidden shadow-2xl"
              >
                <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <Navbar 
            title="KamerPay Control Room" 
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 no-scrollbar scroll-smooth">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
