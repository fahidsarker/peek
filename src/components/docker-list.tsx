"use client";

import { useCallback, useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";

type ContainerItem = {
  id: string;
  name: string;
  state: string;
  runningFor: string | null;
};

export function DockerList() {
  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadContainers = useCallback(() => {
    fetch("/api/docker/containers")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load containers");
        }
        return res.json();
      })
      .then((data) => {
        setContainers(data.containers ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message);
        setContainers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 15000);
    return () => clearInterval(interval);
  }, [loadContainers]);

  async function runAction(id: string, action: string) {
    setActing(`${id}-${action}`);
    try {
      await fetch(`/api/docker/containers/${id}/${action}`, { method: "POST" });
      loadContainers();
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <p className="font-console text-sm text-muted">Loading containers...</p>;
  }

  if (error) {
    return <p className="font-console text-sm text-status-down">{error}</p>;
  }

  if (containers.length === 0) {
    return (
      <p className="font-console text-sm text-muted">No containers found.</p>
    );
  }

  return (
    <FadeIn className="divide-y divide-border">
      {containers.map((container) => {
        const isRunning = container.state === "running";
        const isPaused = container.state === "paused";
        const pauseAction = isPaused ? "unpause" : "pause";

        return (
          <div
            id={`docker-${container.id}`}
            key={container.id}
            className="flex items-center gap-4 py-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-console text-xs text-muted">
              dc
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{container.name}</p>
              <p className="font-console text-xs text-muted">
                {isRunning && container.runningFor
                  ? `Running for ${container.runningFor}`
                  : container.state}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => runAction(container.id, "restart")}
                disabled={acting === `${container.id}-restart`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs text-muted transition-opacity hover:opacity-80 disabled:opacity-40"
                title="Restart"
              >
                ↻
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction(
                    container.id,
                    isRunning || isPaused ? pauseAction : "start",
                  )
                }
                disabled={acting !== null}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs text-muted transition-opacity hover:opacity-80 disabled:opacity-40"
                title={isRunning || isPaused ? "Pause/Start" : "Start"}
              >
                {isRunning || isPaused ? "❚❚" : "▶"}
              </button>
            </div>
          </div>
        );
      })}
    </FadeIn>
  );
}
