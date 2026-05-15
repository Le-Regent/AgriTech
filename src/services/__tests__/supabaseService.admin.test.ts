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
  upsert: vi.fn().mockReturnThis(),
  then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

describe('supabaseService Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.update.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.order.mockReturnThis();
    mockFrom.single.mockReturnThis();
    mockFrom.upsert.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
  });

  it('should get all profiles', async () => {
    const mockProfiles = { data: [{ id: '1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfiles).then(onFullfilled);

    const result = await supabaseService.getAllProfiles();
    expect(result).toEqual(mockProfiles.data);
  });

  it('should toggle user admin status', async () => {
    const mockProfile = { data: { id: 'u1', is_admin: true }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfile).then(onFullfilled);

    const result = await supabaseService.toggleUserAdminStatus('u1', false);
    expect(result).toEqual(mockProfile.data);
  });

  it('should get admin stats', async () => {
    // This calls Promise.all with 4 supabase calls
    // We need to mock .then to resolve differently for each or just return a general success
    const mockData = { data: [{ total_amount: 100 }], count: 10, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockData).then(onFullfilled);

    const result = await supabaseService.getAdminStats();
    expect(result.revenue).toBe(100);
    expect(result.users).toBe(10);
  });

  it('should get system config', async () => {
    const mockConfig = { data: { value: 'test-val' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockConfig).then(onFullfilled);

    const result = await supabaseService.getSystemConfig('test-key');
    expect(result).toBe('test-val');
  });

  it('should update system config', async () => {
    const mockConfig = { data: { value: 'new-val' }, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockConfig).then(onFullfilled);

    const result = await supabaseService.updateSystemConfig('test-key', 'new-val');
    expect(result).toEqual(mockConfig.data);
  });
});
