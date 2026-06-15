import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import SyncManager from '../SyncManager';
import { useOffline } from '@/context/OfflineContext';
import { supabaseService } from '@/services/supabaseService';

vi.mock('@/context/OfflineContext', () => ({
  useOffline: vi.fn(),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: vi.fn(() => ({ addToCart: vi.fn() })),
}));

vi.mock('@/services/supabaseService', () => ({
  supabaseService: {
    updateOrderStatus: vi.fn(() => Promise.resolve()),
  },
}));

describe('SyncManager', () => {
  const clearSyncQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should sync order status update when coming online', async () => {
    const syncQueue = [
      { type: 'ORDER_STATUS_UPDATE', data: { id: 'ord1', status: 'delivered' } }
    ];
    
    (useOffline as any).mockReturnValue({
      isOnline: true,
      syncQueue,
      clearSyncQueue,
    });

    render(<SyncManager />);
    
    expect(supabaseService.updateOrderStatus).toHaveBeenCalledWith('ord1', 'delivered');
    
    vi.advanceTimersByTime(1001);
    expect(clearSyncQueue).toHaveBeenCalled();
  });

  it('should handle multiple sync action types', () => {
    const syncQueue = [
      { type: 'ADD_TO_CART', data: { id: 'p1' } },
      { type: 'ADD_REVIEW', data: { id: 'r1' } },
      { type: 'UNKNOWN', data: {} }
    ];
    
    (useOffline as any).mockReturnValue({
      isOnline: true,
      syncQueue,
      clearSyncQueue,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<SyncManager />);
    
    expect(consoleSpy).toHaveBeenCalledWith('Syncing cart update:', { id: 'p1' });
    expect(consoleSpy).toHaveBeenCalledWith('Syncing new review:', { id: 'r1' });
    expect(warnSpy).toHaveBeenCalledWith('Unknown sync action type:', 'UNKNOWN');
    
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should not sync if offline', () => {
    (useOffline as any).mockReturnValue({
      isOnline: false,
      syncQueue: [{ type: 'ADD_TO_CART' }],
      clearSyncQueue,
    });

    render(<SyncManager />);
    expect(clearSyncQueue).not.toHaveBeenCalled();
  });
});
