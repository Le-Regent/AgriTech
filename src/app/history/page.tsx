'use client';

import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import HistoryContent from './HistoryContent';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
