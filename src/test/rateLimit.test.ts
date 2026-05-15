import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, handleRateLimit } from '../lib/security/rateLimit';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ data, ...options })),
  },
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within limit', () => {
    const ip = '1.2.3.4';
    const result = rateLimit(ip, { limit: 2, windowMs: 1000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should block requests exceeding limit', () => {
    const ip = '2.3.4.5';
    rateLimit(ip, { limit: 1, windowMs: 1000 });
    const result = rateLimit(ip, { limit: 1, windowMs: 1000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    const ip = '3.4.5.6';
    vi.useFakeTimers();
    
    rateLimit(ip, { limit: 1, windowMs: 1000 });
    
    vi.advanceTimersByTime(1001);
    
    const result = rateLimit(ip, { limit: 1, windowMs: 1000 });
    expect(result.success).toBe(true);
    
    vi.useRealTimers();
  });

  describe('handleRateLimit', () => {
    it('should return null if within limit', () => {
      const response = handleRateLimit('7.8.9.0', 5, 60000);
      expect(response).toBeNull();
    });

    it('should return 429 response if limit exceeded', () => {
      handleRateLimit('8.9.0.1', 1, 60000);
      const response = handleRateLimit('8.9.0.1', 1, 60000) as any;
      
      expect(response).not.toBeNull();
      expect(response.status).toBe(429);
      expect(NextResponse.json).toHaveBeenCalled();
    });
  });
});
