import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../orderService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createOrder should call supabase with correct params', async () => {
    const mockOrder = { buyer_id: 'user-1', total_amount: 100 };
    const mockItems = [{ product_id: 'prod-1', quantity: 2 }];
    const mockOrderResponse = { id: 'order-1', ...mockOrder };

    const mockSingle = vi.fn().mockResolvedValue({ data: mockOrderResponse, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    
    // Setup for order insert
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'orders') {
        return { insert: mockInsert };
      }
      if (table === 'order_items') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const result = await orderService.createOrder(mockOrder, mockItems);
    expect(result).toEqual(mockOrderResponse);
    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(supabase.from).toHaveBeenCalledWith('order_items');
  });

  it('updateOrderStatus should call supabase correctly', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: {}, error: null });
    
    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({ eq: mockEq });

    await orderService.updateOrderStatus('order-1', 'confirmed');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmed' });
    expect(mockEq).toHaveBeenCalledWith('id', 'order-1');
  });
});
