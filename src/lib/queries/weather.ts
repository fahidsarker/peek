import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";

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
  const initial = await fetch("/api/weather").then(
    (res) => res.json() as Promise<WeatherResponse>,
  );

  if (initial.useCurrentLocation) {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    return fetch(`/api/weather?lat=${latitude}&lon=${longitude}`).then(
      (res) => res.json() as Promise<WeatherResponse>,
    );
  }

  return initial;
}

export function useWeather() {
  return useQuery({
    queryKey: queryKeys.weather,
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000,
  });
}
