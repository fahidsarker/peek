import { useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { CacheStatusLabel } from "@/components/cache-status-label";
import { DockerContainerDialog } from "@/components/docker-container-dialog";
import { dockerAvatarRingClass, getInitials } from "@/lib/initials";
import { useSession } from "@/lib/auth-context";
import { useDockerContainers } from "@/lib/hooks/use-docker-containers";

export function DockerList() {
  const { user } = useSession();
  const canControl = user?.isAdmin ?? false;
  const { data: containers = [], status, error, refresh } = useDockerContainers();
  const [acting, setActing] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function runAction(id: string, action: string) {
    setActing(`${id}-${action}`);
    try {
      await fetch(`/api/docker/containers/${id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      await refresh();
    } finally {
      setActing(null);
    }
  }

  if (status === "loading" && containers.length === 0) {
    return (
      <p className="font-console text-sm text-muted">Loading containers...</p>
    );
  }

  if (error && containers.length === 0) {
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
    <>
      <FadeIn className="divide-y divide-border">
        {containers.map((container) => {
          const isRunning = container.state === "running";
          const statusButtonClass = isRunning
            ? "bg-status-up/10 text-status-up/80"
            : "bg-status-down/10 text-status-down/80";

          return (
            <div
              id={`docker-${container.id}`}
              key={container.id}
              className="flex items-center gap-4 py-4"
            >
              <button
                type="button"
                onClick={() => setSelectedId(container.id)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left transition-opacity hover:opacity-80"
              >
                <div
                  className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-console text-xs text-muted ${!canControl ? dockerAvatarRingClass(container.state) : ""}`}
                >
                  {getInitials(container.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{container.name}</p>
                  <p className="font-console text-xs text-muted">
                    {isRunning && container.runningFor
                      ? `Running for ${container.runningFor}`
                      : container.state}
                  </p>
                </div>
              </button>
              {canControl && (
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
              {isRunning ? (
                <button
                  type="button"
                  onClick={() => runAction(container.id, "stop")}
                  disabled={acting === `${container.id}-stop`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs transition-opacity hover:opacity-80 disabled:opacity-40 ${statusButtonClass}`}
                  title="Stop"
                >
                  ■
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runAction(container.id, "start")}
                  disabled={acting === `${container.id}-start`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs transition-opacity hover:opacity-80 disabled:opacity-40 ${statusButtonClass}`}
                  title="Start"
                >
                  ▶
                </button>
              )}
              </div>
              )}
            </div>
          );
      })}
      </FadeIn>

      <DockerContainerDialog
        containerId={selectedId}
        canControl={canControl}
        onClose={() => setSelectedId(null)}
        onContainersRefresh={refresh}
      />
    </>
  );
}

export function DockerListHeader() {
  const { status } = useDockerContainers();
  return <CacheStatusLabel status={status} />;
}
