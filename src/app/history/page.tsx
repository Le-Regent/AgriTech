'use client';

import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import HistoryContent from './HistoryContent';
import { Suspense } from 'react';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <HistoryContent />
      </Suspense>
    </ProtectedRoute>
  );
}
