"use client";

import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";

type WeatherData = {
  temperature: number;
  description: string;
  city: string;
};

type WeatherResponse = {
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

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const initial = await fetch("/api/weather").then(
          (res) => res.json() as Promise<WeatherResponse>,
        );

        if (cancelled) return;

        if (initial.useCurrentLocation) {
          try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            const located = await fetch(
              `/api/weather?lat=${latitude}&lon=${longitude}`,
            ).then((res) => res.json() as Promise<WeatherResponse>);

            if (cancelled) return;
            setWeather(located.weather);
            setStatus(located.weather ? "ready" : "unavailable");
          } catch {
            if (cancelled) return;
            setWeather(null);
            setStatus("unavailable");
          }
          return;
        }

        setWeather(initial.weather);
        setStatus(initial.weather ? "ready" : "unavailable");
      } catch {
        if (cancelled) return;
        setWeather(null);
        setStatus("unavailable");
      }
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        Weather info
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        {status === "unavailable" ? "Location unavailable" : "Weather info"}
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs">
        <span className="text-foreground">{weather.city}</span>
        <span className="mx-2 text-muted">·</span>
        <span>{Math.round(weather.temperature)}°C</span>
        <span className="mx-2 text-muted">·</span>
        <span className="text-muted">{weather.description}</span>
      </div>
    </FadeIn>
  );
}
