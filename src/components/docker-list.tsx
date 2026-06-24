"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { useDockerContainers } from "@/lib/queries/docker";
import { queryKeys } from "@/lib/queries/keys";

export function DockerList() {
  const queryClient = useQueryClient();
  const {
    data: containers = [],
    isPending,
    error,
  } = useDockerContainers({ refetchInterval: 15_000 });
  const [acting, setActing] = useState<string | null>(null);

  async function runAction(id: string, action: string) {
    setActing(`${id}-${action}`);
    try {
      await fetch(`/api/docker/containers/${id}/${action}`, { method: "POST" });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dockerContainers,
      });
    } finally {
      setActing(null);
    }
  }

  if (isPending) {
    return <p className="font-console text-sm text-muted">Loading containers...</p>;
  }

  if (error) {
    return (
      <p className="font-console text-sm text-status-down">{error.message}</p>
    );
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
