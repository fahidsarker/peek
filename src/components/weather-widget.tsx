"use client";

import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";

type WeatherData = {
  temperature: number;
  description: string;
  city: string;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => res.json())
      .then((data) => setWeather(data.weather))
      .catch(() => setWeather(null));
  }, []);

  if (!weather) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        Weather info
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
