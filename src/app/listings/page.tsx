import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ListingsContent from './ListingsContent';

export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <ListingsContent />
      </div>
    </ProtectedRoute>
  );
}
