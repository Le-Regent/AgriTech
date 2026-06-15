import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCampayToken, initiateCollect, checkTransactionStatus, initiateWithdrawal } from '../payments/campay';

global.fetch = vi.fn();

describe('Campay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAMPAY_APP_USERNAME = 'test_user';
    process.env.CAMPAY_APP_PASSWORD = 'test_password';
    process.env.CAMPAY_ENVIRONMENT = 'demo';
    delete process.env.CAMPAY_PERMANENT_TOKEN;
  });

  describe('getCampayToken', () => {
    it('should return permanent token if provided', async () => {
      process.env.CAMPAY_PERMANENT_TOKEN = 'perm_token';
      const token = await getCampayToken();
      expect(token).toBe('perm_token');
    });

    it('should fetch new token if permanent token is missing', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'new_token' }),
      });

      const token = await getCampayToken();
      expect(token).toBe('new_token');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/token/'), expect.any(Object));
    });

    it('should throw if credentials missing', async () => {
      process.env.CAMPAY_APP_USERNAME = '';
      await expect(getCampayToken()).rejects.toThrow('Campay credentials missing');
    });
  });

  describe('initiateCollect', () => {
    it('should call collect endpoint with correct amount and phone', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'mock_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reference: 'ref123' }),
        });

      const result = await initiateCollect(1500, '655667788', 'ext123');
      expect(result.reference).toBe('ref123');
      
      const lastFetchCall = (fetch as any).mock.calls[1];
      const body = JSON.parse(lastFetchCall[1].body);
      expect(body.amount).toBe('1500');
      expect(body.from).toBe('237655667788');
    });
  });

  describe('checkTransactionStatus', () => {
    it('should return transaction details', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'mock_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'SUCCESSFUL', reference: 'ref123' }),
        });

      const result = await checkTransactionStatus('ref123');
      expect(result.status).toBe('SUCCESSFUL');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/transaction/ref123/'), expect.any(Object));
    });
  });

  describe('initiateWithdrawal', () => {
    it('should call withdraw endpoint', async () => {
       (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'mock_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reference: 'ref456' }),
        });

      const result = await initiateWithdrawal(2000, '677889900', 'ext456');
      expect(result.reference).toBe('ref456');
      
      const lastFetchCall = (fetch as any).mock.calls[1];
      expect(lastFetchCall[0]).toContain('/withdraw/');
      const body = JSON.parse(lastFetchCall[1].body);
      expect(body.to).toBe('237677889900');
    });
  });
});
