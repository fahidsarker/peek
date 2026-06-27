import { FadeIn } from "@/components/fade-in";
import { CacheStatusLabel } from "@/components/cache-status-label";
import { useSystemMetrics } from "@/lib/hooks/use-system-metrics";

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function barColorClass(percent: number): string {
  if (percent >= 80) return "bg-red-400";
  if (percent >= 60) return "bg-yellow-400";
  return "bg-status-up";
}

function MetricBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
      <div
        className={`h-full rounded-full transition-[width,background-color] duration-500 ${barColorClass(percent)}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function MetricRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-muted">{label}</span>
      <MetricBar percent={percent} />
      <span className="w-20 shrink-0 text-right text-foreground">{value}</span>
    </div>
  );
}

export function SystemInfo() {
  const { data: metrics, status, error } = useSystemMetrics();

  if (status === "loading" && !metrics) {
    return (
      <div className="mb-6 rounded-lg border border-border px-4 py-3 font-console text-xs text-muted">
        System info
      </div>
    );
  }

  if (!metrics || error) {
    return (
      <div className="mb-6 rounded-lg border border-border px-4 py-3 font-console text-xs text-muted">
        {error?.message ?? "System info unavailable"}
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="mb-6 rounded-lg border border-border px-4 py-3 font-console text-xs">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-muted">System Info</span>
          <CacheStatusLabel status={status} />
        </div>
        <div className="flex flex-col gap-2.5">
          <MetricRow
            label="CPU"
            value={`${metrics.cpuPercent}%`}
            percent={metrics.cpuPercent}
          />
          <MetricRow
            label="RAM"
            value={`${formatBytes(metrics.ramUsedBytes)} / ${formatBytes(metrics.ramTotalBytes)}`}
            percent={metrics.ramPercent}
          />
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-muted">Disk</span>
            <span className="text-foreground">
              {formatBytes(metrics.diskFreeBytes)} free
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-muted">Net</span>
            {metrics.netRxBytesPerSec !== null &&
            metrics.netTxBytesPerSec !== null ? (
              <span className="text-foreground">
                ↓ {formatRate(metrics.netRxBytesPerSec)} · ↑{" "}
                {formatRate(metrics.netTxBytesPerSec)}
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
