'use client';

import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUser } from '@/context/UserContext';
import { motion } from 'motion/react';

import AdminAuthGuard from '@/components/layout/AdminAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Navbar title="Admin Command Center" />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
