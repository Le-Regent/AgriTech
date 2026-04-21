import { useState, useEffect } from 'react';
import { getWeatherData, getCurrentPosition, getForecastData, WeatherData, ForecastData } from '@/lib/weatherService';

export function useWeather(defaultLat = 4.05, defaultLon = 9.71) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        let coords = { latitude: defaultLat, longitude: defaultLon };
        
        try {
          const position = await getCurrentPosition();
          coords = position.coords;
        } catch (posErr) {
          console.warn('Geolocation failed, using default coords', posErr);
        }

        const [weatherData, forecastData] = await Promise.all([
          getWeatherData(coords.latitude, coords.longitude),
          getForecastData(coords.latitude, coords.longitude)
        ]);

        setWeather(weatherData);
        setForecast(forecastData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [defaultLat, defaultLon]);

  return { weather, forecast, loading, error };
}
