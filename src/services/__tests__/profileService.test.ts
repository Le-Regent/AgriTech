import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from '../profileService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile should return profile data', async () => {
    const mockProfile = { id: 'u1', full_name: 'John Doe' };
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockEq }),
    });

    const result = await profileService.getProfile('u1');
    expect(result).toEqual(mockProfile);
    expect(mockEq).toHaveBeenCalledWith('id', 'u1');
  });

  it('updateProfile should call upsert', async () => {
    const mockProfileData = { full_name: 'John Smith' };
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'u1', ...mockProfileData }, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    
    (supabase.from as any).mockReturnValue({
      upsert: vi.fn().mockReturnValue({ select: mockSelect }),
    });

    await profileService.updateProfile('u1', mockProfileData);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });
});
