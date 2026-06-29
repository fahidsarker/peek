import { useCallback, useEffect, useState } from "react";
import type { ContainerDetails } from "@/types/dashboard";

async function fetchContainerDetail(
  id: string,
): Promise<ContainerDetails> {
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
  const [data, setData] = useState<ContainerDetails | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (id: string, initial = false) => {
    if (initial) {
      setStatus("loading");
      setError(null);
    }

    try {
      const container = await fetchContainerDetail(id);
      setData(container);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load container"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!containerId) {
      setData(null);
      setStatus("idle");
      setError(null);
      return;
    }

    void load(containerId, true);
  }, [containerId, load]);

  useEffect(() => {
    if (!containerId || status !== "ready" || data?.state !== "running") {
      return;
    }

    const interval = setInterval(() => {
      void load(containerId);
    }, 3000);

    return () => clearInterval(interval);
  }, [containerId, data?.state, load, status]);

  const refresh = useCallback(() => {
    if (containerId) return load(containerId);
  }, [containerId, load]);

  return { data, status, error, refresh };
}
