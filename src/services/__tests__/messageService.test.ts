import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageService } from '../messageService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('messageService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('getMessages should call supabase with or filter', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOr = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ or: mockOr });
    mockOr.mockReturnValue({ order: mockOrder });

    await messageService.getMessages('user-1');
    expect(mockOr).toHaveBeenCalledWith('sender_id.eq.user-1,receiver_id.eq.user-1');
  });

  it('sendMessage should call insert', async () => {
    const mockMessage = { sender_id: 'u1', receiver_id: 'u2', content: 'test' };
    await messageService.sendMessage(mockMessage);
    expect(supabase.from).toHaveBeenCalledWith('messages');
  });
});
