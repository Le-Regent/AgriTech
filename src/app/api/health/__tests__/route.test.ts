import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Health API Route', () => {
  it('should return a healthy status', async () => {
    const response = await GET() as any;
    const data = await response.json();
    
    expect(data.status).toBe('healthy');
    expect(data.environment).toBeDefined();
    expect(response.status).toBe(200);
    expect(NextResponse.json).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Force an error by mocking process.uptime to throw
    const originalUptime = process.uptime;
    process.uptime = vi.fn(() => { throw new Error('Test Error'); });

    const response = await GET() as any;
    const data = await response.json();

    expect(data.status).toBe('unhealthy');
    expect(response.status).toBe(500);

    // Restore
    process.uptime = originalUptime;
  });
});
