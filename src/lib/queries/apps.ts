import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import type { AppItem } from "@/types/dashboard";

async function fetchAppsStatus(): Promise<AppItem[]> {
  const res = await fetch("/api/apps/status?refresh=true");
  if (!res.ok) {
    throw new Error("Failed to load apps");
  }
  const data = await res.json();
  return data.apps ?? [];
}

export function useAppsStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apps,
    queryFn: fetchAppsStatus,
    enabled: options?.enabled,
  });
}
