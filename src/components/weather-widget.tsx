"use client";

import { FadeIn } from "@/components/fade-in";
import { useWeather } from "@/lib/queries/weather";

export function WeatherWidget() {
  const { data, isPending, isError } = useWeather();
  const weather = data?.weather ?? null;

  if (isPending && !weather) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        Weather info
      </div>
    );
  }

  if (!weather || isError) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        {isError || data?.useCurrentLocation ? "Location unavailable" : "Weather info"}
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
