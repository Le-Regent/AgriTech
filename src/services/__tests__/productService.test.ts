import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../productService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProducts should return data from supabase', async () => {
    const mockData = [{ id: '1', name: 'Tomato' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await productService.getProducts();
    expect(result).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('products');
  });

  it('getProducts should throw error if supabase returns error', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    });

    await expect(productService.getProducts()).rejects.toThrow('Database error');
  });

  it('getProductById should call supabase with correct params', async () => {
    const mockData = { id: '1', name: 'Tomato' };
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    });
    mockEq.mockReturnValue({ single: mockSingle });

    const result = await productService.getProductById('1');
    expect(result).toEqual(mockData);
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  describe('updateProductStock', () => {
    it('should correctly calculate and update stock', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ 
        data: { stock_quantity: 10, initial_stock_quantity: 100, farmer_id: 'f1', name: 'Tomato' }, 
        error: null 
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({ 
              eq: vi.fn().mockReturnValue({ single: mockFetch }) 
            }),
            update: mockUpdate,
          };
        }
        if (table === 'notifications') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      // We need to handle the chain properly
      // mockUpdate returns an object with eq
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });

      const newStock = await productService.updateProductStock('prod-1', 2);
      expect(newStock).toBe(8);
      expect(mockUpdate).toHaveBeenCalledWith({ stock_quantity: 8 });
      expect(mockEqUpdate).toHaveBeenCalledWith('id', 'prod-1');
    });

    it('should send notification when stock drops below threshold', async () => {
      // Stock goes from 30 to 20, threshold is 100 * 0.25 = 25
      const mockFetch = vi.fn().mockResolvedValue({ 
        data: { stock_quantity: 30, initial_stock_quantity: 100, farmer_id: 'f1', name: 'Tomato' }, 
        error: null 
      });
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockNotificationInsert = vi.fn().mockResolvedValue({ error: null });
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockFetch }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(mockUpdate) }),
          };
        }
        if (table === 'notifications') {
          return { insert: mockNotificationInsert };
        }
        return {};
      });

      await productService.updateProductStock('prod-1', 10);
      expect(mockNotificationInsert).toHaveBeenCalled();
    });
  });
});
