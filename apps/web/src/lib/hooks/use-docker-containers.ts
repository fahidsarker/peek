import type { ContainerItem } from "@/types/dashboard";
import { useCachedData } from "../cache/use-cached-data";

async function fetchDockerContainers(): Promise<ContainerItem[]> {
  const res = await fetch("/api/docker/containers", { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to load containers");
  }
  const data = await res.json();
  return data.containers ?? [];
}

export function useDockerContainers(options?: { enabled?: boolean }) {
  return useCachedData<ContainerItem[]>({
    key: "docker",
    fetcher: fetchDockerContainers,
    socketEvent: "docker:containers",
    socketParser: (payload) =>
      (payload as { containers: ContainerItem[] }).containers,
    enabled: options?.enabled ?? true,
  });
}
