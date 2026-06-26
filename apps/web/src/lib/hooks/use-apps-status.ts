import type { AppItem } from "@/types/dashboard";
import { useCachedData } from "../cache/use-cached-data";

async function fetchAppsStatus(): Promise<AppItem[]> {
  const res = await fetch("/api/apps/status?refresh=true", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load apps");
  const data = await res.json();
  return data.apps ?? [];
}

export function useAppsStatus(options?: { enabled?: boolean }) {
  return useCachedData<AppItem[]>({
    key: "apps",
    fetcher: fetchAppsStatus,
    socketEvent: "apps:status",
    socketParser: (payload) => (payload as { apps: AppItem[] }).apps,
    enabled: options?.enabled ?? true,
  });
}
