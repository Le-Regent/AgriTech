export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  windSpeed: number;
  rain?: number;
}

export interface ForecastItem {
  time: string;
  temp: number;
  rain: number;
}

export interface ForecastData {
  hourly: ForecastItem[];
  daily: ForecastItem[];
}

const MOCK_WEATHER: WeatherData = {
  temp: 28,
  humidity: 82,
  description: 'Humid and Sunny',
  icon: '01d',
  city: 'Douala',
  windSpeed: 3.2,
};

const MOCK_FORECAST: ForecastData = {
  hourly: [
    { time: '09:00', temp: 18, rain: 0 },
    { time: '12:00', temp: 22, rain: 0.1 },
    { time: '15:00', temp: 24, rain: 0 },
    { time: '18:00', temp: 21, rain: 0.5 },
    { time: '21:00', temp: 19, rain: 0.2 },
    { time: '00:00', temp: 17, rain: 0 },
  ],
  daily: [
    { time: 'Mon', temp: 22, rain: 0 },
    { time: 'Tue', temp: 24, rain: 1.2 },
    { time: 'Wed', temp: 21, rain: 0.5 },
    { time: 'Thu', temp: 23, rain: 0 },
    { time: 'Fri', temp: 25, rain: 0 },
    { time: 'Sat', temp: 26, rain: 0 },
    { time: 'Sun', temp: 24, rain: 0.8 },
  ],
};

// Simple cache
const cache = {
  weather: new Map<string, { data: WeatherData; timestamp: number }>(),
  forecast: new Map<string, { data: ForecastData; timestamp: number }>(),
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.weather.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `/api/weather?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Weather API key is missing or unauthorized. Using mock data.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Weather API error:', response.status, errorData);
      }
      return MOCK_WEATHER;
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      windSpeed: data.wind.speed,
      rain: data.rain ? data.rain['1h'] : undefined,
    };

    cache.weather.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data, using mock:', error);
    return MOCK_WEATHER;
  }
}

export async function getForecastData(lat: number, lon: number): Promise<ForecastData | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.forecast.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `/api/forecast?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Forecast API key is missing or unauthorized. Using mock data.');
      } else {
        console.warn('Forecast API error:', response.status);
      }
      return MOCK_FORECAST;
    }

    const data = await response.json();
    
    if (!data.list || !Array.isArray(data.list)) {
      console.warn('Invalid forecast data structure from API. Using mock data.');
      return MOCK_FORECAST;
    }
    
    // Process hourly (next 24 hours)
    const hourly: ForecastItem[] = data.list.slice(0, 8).map((item: any) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(item.main.temp),
      rain: item.rain ? item.rain['3h'] / 3 : 0,
    }));

    // Process daily (next 5 days)
    const dailyMap = new Map();
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' });
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          time: date,
          temp: item.main.temp,
          rain: item.rain ? item.rain['3h'] : 0,
          count: 1
        });
      } else {
        const existing = dailyMap.get(date);
        existing.temp += item.main.temp;
        existing.rain += item.rain ? item.rain['3h'] : 0;
        existing.count += 1;
      }
    });

    const daily: ForecastItem[] = Array.from(dailyMap.values()).map(item => ({
      time: item.time,
      temp: Math.round(item.temp / item.count),
      rain: Math.round(item.rain * 10) / 10,
    })).slice(0, 7);

    const forecastData = { hourly, daily };
    cache.forecast.set(cacheKey, { data: forecastData, timestamp: Date.now() });
    return forecastData;
  } catch (error) {
    console.error('Error fetching forecast data, using mock:', error);
    return MOCK_FORECAST;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported. Using default coordinates.');
      resolve({
        coords: {
          latitude: 4.05,
          longitude: 9.71,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    } else {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          console.warn('Geolocation failed. Using default coordinates.', error.message);
          resolve({
            coords: {
              latitude: 4.05,
              longitude: 9.71,
              accuracy: 0,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition);
        },
        { timeout: 10000 }
      );
    }
  });
}
