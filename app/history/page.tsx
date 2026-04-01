import ProtectedRoute from '../components/ProtectedRoute';
import HistoryContent from './HistoryContent';

export const metadata = {
  title: 'Transaction History | AgriConnect',
  description: 'View and manage your agricultural transactions and sales history.',
};

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
