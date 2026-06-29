import { useCallback, useEffect, useState } from "react";
import { dockerAvatarRingClass, getInitials } from "@/lib/initials";
import { useDockerContainerDetail } from "@/lib/hooks/use-docker-container-detail";
import type { ContainerDetails } from "@/types/dashboard";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function stateBadgeClass(state: string): string {
  if (state === "running") return "bg-status-up/10 text-status-up/80";
  if (state === "paused") return "bg-status-unknown/10 text-status-unknown/80";
  return "bg-status-down/10 text-status-down/80";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="font-console text-xs text-muted">{label}</span>
      <span className="truncate text-right text-sm">{value}</span>
    </div>
  );
}

function DialogBody({
  data,
  acting,
  canControl,
  onClose,
  onAction,
}: {
  data: ContainerDetails;
  acting: string | null;
  canControl: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  const isRunning = data.state === "running";
  const statusButtonClass = isRunning
    ? "bg-status-up/10 text-status-up/80"
    : "bg-status-down/10 text-status-down/80";

  return (
    <>
      <div className="flex items-start gap-4 border-b border-border px-6 py-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background font-console text-xs text-muted ${!canControl ? dockerAvatarRingClass(data.state) : ""}`}
        >
          {getInitials(data.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{data.name}</p>
          <p className="truncate font-console text-xs text-muted">
            {data.shortId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-console text-xs text-muted transition-opacity hover:opacity-80"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="divide-y divide-border px-6">
        <div className="py-3">
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="font-console text-xs text-muted">State</span>
            <span
              className={`rounded-full px-2 py-0.5 font-console text-xs capitalize ${stateBadgeClass(data.state)}`}
            >
              {data.state}
            </span>
          </div>
          <DetailRow label="Image" value={data.image} />
          <DetailRow label="Status" value={data.status} />
          {data.runningFor && (
            <DetailRow label="Running for" value={data.runningFor} />
          )}
        </div>

        <div className="py-3">
          <p className="pb-1 font-console text-xs text-muted">Resources</p>
          {data.stats ? (
            <>
              <DetailRow
                label="CPU"
                value={`${data.stats.cpuPercent.toFixed(1)}%`}
              />
              <DetailRow
                label="Memory"
                value={`${formatBytes(data.stats.memoryUsage)} / ${formatBytes(data.stats.memoryLimit)}`}
              />
            </>
          ) : (
            <p className="py-2 font-console text-xs text-muted">Not running</p>
          )}
        </div>
      </div>

      {canControl && (
      <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={() => onAction("restart")}
          disabled={acting === "restart"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs text-muted transition-opacity hover:opacity-80 disabled:opacity-40"
          title="Restart"
        >
          ↻
        </button>
        {isRunning ? (
          <button
            type="button"
            onClick={() => onAction("stop")}
            disabled={acting === "stop"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs transition-opacity hover:opacity-80 disabled:opacity-40 ${statusButtonClass}`}
            title="Stop"
          >
            ■
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction("start")}
            disabled={acting === "start"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-border font-console text-xs transition-opacity hover:opacity-80 disabled:opacity-40 ${statusButtonClass}`}
            title="Start"
          >
            ▶
          </button>
        )}
      </div>
      )}
    </>
  );
}

export function DockerContainerDialog({
  containerId,
  canControl,
  onClose,
  onContainersRefresh,
}: {
  containerId: string | null;
  canControl: boolean;
  onClose: () => void;
  onContainersRefresh?: () => Promise<void>;
}) {
  const { data, status, error, refresh } = useDockerContainerDetail(containerId);
  const [acting, setActing] = useState<string | null>(null);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  async function runAction(action: string) {
    if (!containerId) return;
    setActing(action);
    try {
      await fetch(`/api/docker/containers/${containerId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      await refresh();
      await onContainersRefresh?.();
    } finally {
      setActing(null);
    }
  }

  useEffect(() => {
    if (!containerId) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [containerId, close]);

  if (!containerId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Container details"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "loading" && !data ? (
          <div className="px-6 py-8">
            <p className="font-console text-sm text-muted">Loading...</p>
          </div>
        ) : status === "error" ? (
          <div className="px-6 py-8">
            <p className="font-console text-sm text-status-down">
              {error?.message ?? "Failed to load container"}
            </p>
          </div>
        ) : data ? (
          <DialogBody
            data={data}
            acting={acting}
            canControl={canControl}
            onClose={close}
            onAction={runAction}
          />
        ) : null}
      </div>
    </div>
  );
}
