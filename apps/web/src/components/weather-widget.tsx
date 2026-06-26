import { FadeIn } from "@/components/fade-in";
import { CacheStatusLabel } from "@/components/cache-status-label";
import { useWeather } from "@/lib/hooks/use-weather";

export function WeatherWidget() {
  const { data, status, error } = useWeather();
  const weather = data?.weather ?? null;

  if (status === "loading" && !weather) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        Weather info
      </div>
    );
  }

  if (!weather || error) {
    return (
      <div className="mt-4 inline-block rounded-lg border border-border px-4 py-2 font-console text-xs text-muted">
        {error || data?.useCurrentLocation
          ? "Location unavailable"
          : "Weather info"}
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-console text-xs">
        <span className="text-foreground">{weather.city}</span>
        <span className="text-muted">·</span>
        <span>{Math.round(weather.temperature)}°C</span>
        <span className="text-muted">·</span>
        <span className="text-muted">{weather.description}</span>
        <CacheStatusLabel status={status} />
      </div>
    </FadeIn>
  );
}
