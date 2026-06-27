import type { SystemMetrics } from "@/types/dashboard";
import { useCachedData } from "../cache/use-cached-data";

async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const res = await fetch("/api/system/metrics", { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to load system metrics");
  }
  const data = await res.json();
  return data.metrics;
}

export function useSystemMetrics() {
  return useCachedData<SystemMetrics>({
    key: "system-metrics",
    fetcher: fetchSystemMetrics,
    socketEvent: "system:metrics",
    socketParser: (payload) =>
      (payload as { metrics: SystemMetrics }).metrics,
  });
}
