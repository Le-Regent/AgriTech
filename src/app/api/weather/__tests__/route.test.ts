import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Weather API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENWEATHER_API_KEY: 'test-key' };
    global.fetch = vi.fn();
  });

  it('should return error if apiKey is missing', async () => {
    delete process.env.OPENWEATHER_API_KEY;
    const req = new Request('http://localhost/api/weather?lat=4&lon=9');
    const response = await GET(req) as any;
    const data = await response.json();
    expect(data.error).toBe('Weather API key is missing');
    expect(response.status).toBe(401);
  });

  it('should return error if params are missing', async () => {
    const req = new Request('http://localhost/api/weather');
    const response = await GET(req) as any;
    const data = await response.json();
    expect(data.error).toBe('Latitude and longitude are required');
    expect(response.status).toBe(400);
  });

  it('should return weather data on success', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ main: { temp: 25 } }),
    });

    const req = new Request('http://localhost/api/weather?lat=4&lon=9');
    const response = await GET(req) as any;
    const data = await response.json();

    expect(data.main.temp).toBe(25);
    expect(response.status).toBe(200);
  });

  it('should handle fetch failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const req = new Request('http://localhost/api/weather?lat=4&lon=9');
    const response = await GET(req) as any;
    const data = await response.json();

    expect(data.error).toBe('Failed to fetch weather data');
    expect(response.status).toBe(404);
  });

  it('should handle server error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const req = new Request('http://localhost/api/weather?lat=4&lon=9');
    const response = await GET(req) as any;
    const data = await response.json();

    expect(data.error).toBe('Internal Server Error');
    expect(response.status).toBe(500);
  });
});
