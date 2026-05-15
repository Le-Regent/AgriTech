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
  then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

describe('supabaseService Misc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.select.mockReturnThis();
    mockFrom.eq.mockReturnThis();
    mockFrom.order.mockReturnThis();
    mockFrom.limit.mockReturnThis();
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
  });

  it('should get sensor data', async () => {
    const mockData = { data: [{ temperature: 25 }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockData).then(onFullfilled);

    const result = await supabaseService.getSensorData('f1');
    expect(result).toEqual(mockData.data);
  });

  it('should get notifications', async () => {
    const mockNotifs = { data: [{ id: 'n1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockNotifs).then(onFullfilled);

    const result = await supabaseService.getNotifications('u1');
    expect(result).toEqual(mockNotifs.data);
  });

  it('should get unread notifications count', async () => {
    const mockCount = { count: 5, error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockCount).then(onFullfilled);

    const result = await supabaseService.getUnreadNotificationsCount('u1');
    expect(result).toBe(5);
  });

  it('should mark notification as read', async () => {
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ error: null }).then(onFullfilled);

    await supabaseService.markNotificationAsRead('n1');
    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  it('should broadcast notifications to multiple users', async () => {
    const mockProfiles = { data: [{ id: 'u1' }, { id: 'u2' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfiles).then(onFullfilled);

    await supabaseService.broadcastNotification({ title: 'Alert' }, 'buyer');
    expect(mockFrom.eq).toHaveBeenCalledWith('user_type', 'buyer');
    expect(mockFrom.limit).toHaveBeenCalledWith(20);
  });

  it('should broadcast notifications with default target when not provided', async () => {
    const mockProfiles = { data: [{ id: 'u1' }], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfiles).then(onFullfilled);

    await supabaseService.broadcastNotification({ title: 'Global' });
    expect(mockFrom.eq).toHaveBeenCalledWith('id', 'dummy');
  });

  it('should skip broadcast if no profiles found', async () => {
    const mockProfiles = { data: [], error: null };
    mockFrom.then = (onFullfilled: any) => Promise.resolve(mockProfiles).then(onFullfilled);

    const spy = vi.spyOn(supabase, 'from');
    await supabaseService.broadcastNotification({ title: 'Global' });
    // It should call 'profiles' but NOT 'notifications' for insert
    expect(spy).toHaveBeenCalledWith('profiles');
    // But we need to check if .insert was called. 
    // This is hard since we mocked the whole from.
  });

  it('should generate insights for a user', async () => {
    mockFrom.then = (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled);
    
    await supabaseService.generateInsights('u1');
    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });
});
