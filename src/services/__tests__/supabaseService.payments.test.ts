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
  then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

describe('supabaseService Payments & logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.update.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.single.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
    global.fetch = vi.fn();
  });

  it('should verify order OTP successfully', async () => {
    const mockOrder = { data: { otp_code: '123456', status: 'pre_shipped', buyer_id: 'b1' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrder).then(onFullfilled);

    const result = await supabaseService.verifyOrderOTP('o1', '123456');
    expect(result).toBe(true);
  });

  it('should throw if OTP is invalid', async () => {
    const mockOrder = { data: { otp_code: '123456', status: 'pre_shipped', buyer_id: 'b1' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockOrder).then(onFullfilled);

    await expect(supabaseService.verifyOrderOTP('o1', 'wrong')).rejects.toThrow(/Invalid OTP code/);
  });

  it('should handle payment initiation timeout', async () => {
    // Mock fetch to simulate AbortError
    (global.fetch as any).mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(supabaseService.initiateCampayPayment(1000, '600000000', 'o1')).rejects.toThrow(/Payment initiation timed out/);
  });

  it('should handle status check timeout', async () => {
    (global.fetch as any).mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(supabaseService.checkCampayStatus('ref1')).rejects.toThrow(/Status check timed out/);
  });

  it('should return 0 for unread notifications count on error', async () => {
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: null, error: { message: 'DB Error' } }).then(onFullfilled);
    
    const count = await supabaseService.getUnreadNotificationsCount('u1');
    expect(count).toBe(0);
  });
});
