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
  in: vi.fn().mockReturnThis(),
  then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

describe('supabaseService Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.order.mockReturnThis();
    mockFrom.in.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
  });

  it('should get orders for buyer', async () => {
    const mockOrders = { data: [{ id: 'o1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrders).then(onFullfilled);

    const orders = await supabaseService.getOrders('u1', 'buyer');
    expect(orders).toEqual(mockOrders.data);
  });

  it('should get shipments', async () => {
    const mockShipments = { data: [{ id: 's1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockShipments).then(onFullfilled);

    const result = await supabaseService.getShipments('u1', 'buyer');
    expect(result).toEqual(mockShipments.data);
  });

  it('should update order status', async () => {
    const mockOrder = { data: { id: 'o1', status: 'shipped' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrder).then(onFullfilled);

    const result = await supabaseService.updateOrderStatus('o1', 'shipped');
    expect(result).toEqual(mockOrder.data);
  });

  it('should get all orders (admin)', async () => {
    const mockOrders = { data: [{ id: 'o1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrders).then(onFullfilled);

    const result = await supabaseService.getAllOrders();
    expect(result).toEqual(mockOrders.data);
  });
});
