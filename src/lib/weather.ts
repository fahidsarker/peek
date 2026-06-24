import { getSettings } from "@/lib/settings";

export type WeatherData = {
  temperature: number;
  description: string;
  city: string;
};

export type WeatherOptions = {
  lat?: number;
  lon?: number;
};

let weatherCache: {
  key: string;
  data: WeatherData;
  expiresAt: number;
} | null = null;

async function fetchOpenMeteo(lat: number, lon: number, city: string): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "celsius");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = await response.json();
  const code = data.current.weather_code as number;

  return {
    temperature: data.current.temperature_2m,
    description: weatherCodeToDescription(code),
    city,
  };
}

async function fetchOpenWeather(
  lat: number,
  lon: number,
  apiKey: string,
  city: string,
): Promise<WeatherData> {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = await response.json();
  return {
    temperature: data.main.temp,
    description: data.weather[0]?.description ?? "Unknown",
    city: city || data.name,
  };
}

function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function cacheKey(lat: number, lon: number, provider: string): string {
  return `${provider}:${lat}:${lon}`;
}

export async function getWeatherConfig() {
  const settings = await getSettings();
  return {
    useCurrentLocation: settings.weatherUseCurrentLocation,
  };
}

export async function getWeather(options: WeatherOptions = {}): Promise<WeatherData | null> {
  const settings = await getSettings();

  let lat: number | null = null;
  let lon: number | null = null;
  let city: string;

  if (settings.weatherUseCurrentLocation) {
    if (options.lat == null || options.lon == null) {
      return null;
    }
    lat = options.lat;
    lon = options.lon;
    city = "Current location";
  } else {
    if (settings.weatherLat == null || settings.weatherLon == null) {
      return null;
    }
    lat = settings.weatherLat;
    lon = settings.weatherLon;
    city = settings.weatherCity ?? "Local";
  }

  const key = cacheKey(lat, lon, settings.weatherProvider);
  if (weatherCache && weatherCache.key === key && weatherCache.expiresAt > Date.now()) {
    return weatherCache.data;
  }

  let data: WeatherData;

  if (
    settings.weatherProvider === "openweather" &&
    settings.openWeatherApiKey
  ) {
    data = await fetchOpenWeather(
      lat,
      lon,
      settings.openWeatherApiKey,
      city,
    );
  } else {
    data = await fetchOpenMeteo(lat, lon, city);
  }

  weatherCache = {
    key,
    data,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  return data;
}

export function clearWeatherCache() {
  weatherCache = null;
}
