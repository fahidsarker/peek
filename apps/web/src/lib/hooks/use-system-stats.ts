import type { SystemStats } from "@/types/dashboard";
import { useCachedData } from "../cache/use-cached-data";

async function fetchSystemStats(): Promise<SystemStats> {
  const res = await fetch("/api/system/stats", { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to load system stats");
  }
  const data = await res.json();
  return data.stats;
}

export function useSystemStats(options?: { enabled?: boolean }) {
  return useCachedData<SystemStats>({
    key: "system",
    fetcher: fetchSystemStats,
    socketEvent: "system:stats",
    socketParser: (payload) =>
      (payload as { stats: SystemStats }).stats,
    enabled: options?.enabled ?? true,
  });
}
