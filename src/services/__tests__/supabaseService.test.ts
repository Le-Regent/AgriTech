import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../supabaseService';
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
      upsert: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('supabaseService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Profiles', () => {
    it('getProfile should fetch user by id', async () => {
      const mockUser = { id: '1', full_name: 'Test User' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq }),
      });

      const result = await supabaseService.getProfile('1');
      expect(result).toEqual(mockUser);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('updateProfile should call update on supabase', async () => {
      const mockResponse = { data: { id: '1' }, error: null };
      const mockEq = vi.fn().mockResolvedValue(mockResponse);
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await supabaseService.updateProfile('1', { full_name: 'New Name' });
      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'New Name' });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('Products', () => {
    it('getProducts should join with profiles', async () => {
      const mockData = [{ id: '1', name: 'Product 1' }];
      const mockSelect = vi.fn().mockResolvedValue({ data: mockData, error: null });
      
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await supabaseService.getProducts();
      expect(result).toEqual(mockData);
      expect(mockSelect).toHaveBeenCalledWith('*, profiles(full_name, avatar_url, is_verified)');
    });

    it('createProduct should insert and then notify', async () => {
      const mockProduct = { name: 'Tomato', farmer_id: 'f1' };
      const mockCreatedProduct = { id: 'p1', ...mockProduct };
      
      // Mocking the insert chain
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCreatedProduct, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      
      // Mocking broadcastNotification inside the service
      const broadcastSpy = vi.spyOn(supabaseService, 'broadcastNotification')
        .mockResolvedValue(undefined as any);

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseService.createProduct(mockProduct);
      expect(result).toEqual(mockCreatedProduct);
      expect(broadcastSpy).toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    it('getNotifications should sort by status and date', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq }),
      });

      await supabaseService.getNotifications('u1');
      expect(mockOrder1).toHaveBeenCalledWith('is_read', { ascending: true });
      expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});
