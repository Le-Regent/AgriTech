import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeatherData, getForecastData } from '../weatherService';

describe('weatherService', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch weather data', async () => {
    const data = {
      name: 'Douala',
      weather: [{ description: 'clear sky', icon: '01d' }],
      main: { temp: 30, humidity: 80, feels_like: 32 },
      wind: { speed: 5 },
      coord: { lat: 4, lon: 9 }
    };
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => data
    });

    const result = await getWeatherData(4, 9);
    expect(result?.city).toBe('Douala');
    expect(result?.temp).toBe(30);
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' })
    });

    const result = await getWeatherData(4, 9);
    // It returns MOCK_WEATHER on error
    expect(result).toBeDefined();
    expect(result?.city).toBe('Douala'); // MOCK_WEATHER city
  });
});
