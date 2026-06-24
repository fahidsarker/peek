import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import type { ContainerItem } from "@/types/dashboard";

async function fetchDockerContainers(): Promise<ContainerItem[]> {
  const res = await fetch("/api/docker/containers");
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to load containers");
  }
  const data = await res.json();
  return data.containers ?? [];
}

export function useDockerContainers(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: queryKeys.dockerContainers,
    queryFn: fetchDockerContainers,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}
