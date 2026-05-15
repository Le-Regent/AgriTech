import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from '../storageService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.com/test.jpg' } }),
      })),
    },
  },
}));

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadImage should return public URL', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const url = await storageService.uploadImage(file);
    
    expect(url).toBe('https://cdn.com/test.jpg');
    expect(supabase.storage.from).toHaveBeenCalledWith('products');
  });

  it('uploadImage should allow custom bucket', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await storageService.uploadImage(file, 'avatars');
    expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
  });

  it('uploadImage should throw error if upload fails', async () => {
    (supabase.storage.from as any).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } }),
    });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await expect(storageService.uploadImage(file)).rejects.toThrow('Upload failed');
  });
});
