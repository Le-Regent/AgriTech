import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateCollect, initiateWithdrawal, getCampayToken } from '../campay';

describe('Campay Branch Coverage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
  });

  describe('formatCameroonPhone (Internal through public methods)', () => {
    it('should handle numbers starting with 00', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'test-token';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reference: 'ref1' }),
      });

      await initiateCollect(100, '00237666777888', 'ord1');
      // formatCameroonPhone should strip 00
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/collect/'),
        expect.objectContaining({
          body: expect.stringContaining('"from":"237666777888"')
        })
      );
    });

    it('should handle 9-digit numbers starting with 2', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'test-token';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reference: 'ref1' }),
      });

      await initiateWithdrawal(100, '233445566', 'ord1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/withdraw/'),
        expect.objectContaining({
          body: expect.stringContaining('"to":"237233445566"')
        })
      );
    });

    it('should fallback to original if non-numeric and cant be cleaned reliably', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'test-token';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reference: 'ref1' }),
      });

      await initiateCollect(100, 'invalid-phone', 'ord1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/collect/'),
        expect.objectContaining({
          body: expect.stringContaining('"from":"invalid-phone"')
        })
      );
    });
  });

  describe('getCampayToken Error Paths', () => {
    it('should throw error if fetch for token is not ok', async () => {
      delete process.env.CAMPAY_PERMANENT_TOKEN;
      process.env.CAMPAY_APP_USERNAME = 'user';
      process.env.CAMPAY_APP_PASSWORD = 'pass';
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(getCampayToken()).rejects.toThrow(/Campay Authentication Failed/);
    });

    it('should throw error if fetch for token times out', async () => {
      delete process.env.CAMPAY_PERMANENT_TOKEN;
      process.env.CAMPAY_APP_USERNAME = 'user';
      process.env.CAMPAY_APP_PASSWORD = 'pass';
      
      (global.fetch as any).mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(getCampayToken()).rejects.toThrow(/timed out/);
    });
  });

  describe('collect/withdraw response error parsing', () => {
    it('should parse error JSON detail if fetch fails', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'token';
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Invalid amount' })),
      });

      await expect(initiateCollect(100, '655', 'o1')).rejects.toThrow('Invalid amount');
    });

    it('should parse error JSON error if fetch fails', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'token';
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ error: 'Auth failed' })),
      });

      await expect(initiateWithdrawal(100, '655', 'o1')).rejects.toThrow('Auth failed');
    });
    
    it('should throw generic error if JSON parse fails', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'token';
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Not JSON'),
      });

      await expect(initiateWithdrawal(100, '655', 'o1')).rejects.toThrow(/Failed to initiate/);
    });
  });
});
