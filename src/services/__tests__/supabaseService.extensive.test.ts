import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../supabaseService';
import { supabase } from '../../lib/supabase';

const mockFrom = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  match: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  then: (onFullfilled: any) => Promise.resolve({ data: null, error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
  },
}));

describe('supabaseService Extensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.insert.mockReturnThis();
    mockFrom.update.mockReturnThis();
    mockFrom.delete.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.single.mockReturnThis();
    mockFrom.order.mockReturnThis();
    mockFrom.in.mockReturnThis();
    mockFrom.or.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
  });

  describe('Products', () => {
    it('should get products', async () => {
      const mockResult = { data: [{ id: '1', name: 'Tomato' }], error: null };
      mockFrom.then = (onFullfilled: any) => Promise.resolve(mockResult).then(onFullfilled);

      const products = await supabaseService.getProducts();
      expect(products).toEqual(mockResult.data);
    });

    it('should handle product error', async () => {
      mockFrom.then = (onFullfilled: any) => Promise.resolve({ error: { message: 'DB Error' } }).then(onFullfilled);
      await expect(supabaseService.getProducts()).rejects.toThrow('DB Error');
    });
  });

  describe('Orders', () => {
    it('should create an order', async () => {
      const mockOrder = { data: { id: 'order1' }, error: null };
      mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrder).then(onFullfilled);

      const result = await supabaseService.createOrder({ buyer_id: 'user1' }, []);
      expect(result).toEqual(mockOrder.data);
    });
  });

  describe('Profiles', () => {
    it('should create profile', async () => {
      const mockProfile = { data: { id: 'p1' }, error: null };
      mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfile).then(onFullfilled);

      const result = await supabaseService.createProfile({ id: 'p1' });
      expect(result).toEqual(mockProfile.data);
    });
  });

  describe('Messages', () => {
    it('should get conversations', async () => {
      const mockMsgs = { data: [{ sender_id: 'u1', receiver_id: 'u2', message: 'hi' }], error: null };
      mockFrom.then = (onFullfilled: any) => Promise.resolve(mockMsgs).then(onFullfilled);

      const result = await supabaseService.getConversations('u1');
      expect(result.length).toBe(1);
    });
  });

  describe('Error Branch Coverage', () => {
    it('should throw error when createProfile fails', async () => {
      mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: null, error: { message: 'Create failed' } }).then(onFullfilled);
      await expect(supabaseService.createProfile({})).rejects.toThrow('Create failed');
    });

    it('should throw error when getProductById fails', async () => {
      mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: null, error: { message: 'Found nothing' } }).then(onFullfilled);
      await expect(supabaseService.getProductById('p1')).rejects.toThrow('Found nothing');
    });

    it('should throw error when updateProduct fails', async () => {
      mockFrom.then = (onFullfilled: any) => Promise.resolve({ error: { message: 'Update failed' } }).then(onFullfilled);
      await expect(supabaseService.updateProduct('p1', {})).rejects.toThrow('Update failed');
    });
  });
});
