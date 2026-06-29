import { useEffect } from "react";
import { useCachedData } from "../cache/use-cached-data";
import type { ContainerDetails } from "@/types/dashboard";

async function fetchContainerDetail(id: string): Promise<ContainerDetails> {
  const res = await fetch(`/api/docker/containers/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to load container");
  }
  const data = await res.json();
  return data.container;
}

export function useDockerContainerDetail(containerId: string | null) {
  const key = containerId ? `docker:detail:${containerId}` : "docker:detail:idle";

  const { data, status, error, refresh } = useCachedData<ContainerDetails>({
    key,
    fetcher: containerId ? () => fetchContainerDetail(containerId) : undefined,
    enabled: !!containerId,
  });

  useEffect(() => {
    if (!containerId || !data || data.state !== "running") return;

    const interval = setInterval(() => {
      void refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [containerId, data, refresh]);

  return { data, status, error, refresh };
}
