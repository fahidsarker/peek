import { useCachedData } from "../cache/use-cached-data";

export type WeatherData = {
  temperature: number;
  description: string;
  city: string;
};

export type WeatherResponse = {
  weather: WeatherData | null;
  useCurrentLocation: boolean;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
    });
  });
}

async function fetchWeather(): Promise<WeatherResponse> {
  const initial = await fetch("/api/weather", { credentials: "include" }).then(
    (res) => res.json() as Promise<WeatherResponse>,
  );

  if (initial.useCurrentLocation) {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    return fetch(`/api/weather?lat=${latitude}&lon=${longitude}`, {
      credentials: "include",
    }).then((res) => res.json() as Promise<WeatherResponse>);
  }

  return initial;
}

export function useWeather() {
  return useCachedData<WeatherResponse>({
    key: "weather",
    fetcher: fetchWeather,
  });
}
