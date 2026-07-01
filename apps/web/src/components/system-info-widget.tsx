import { intervalToDuration } from "date-fns";
import { CacheStatusLabel } from "@/components/cache-status-label";
import { FadeIn } from "@/components/fade-in";
import { formatBytes, formatRate } from "@/lib/format";
import { useSystemStats } from "@/lib/hooks/use-system-stats";

function usageBarColor(percent: number): string {
  if (percent >= 85) return "bg-status-down/50";
  if (percent >= 60) return "bg-orange-400/40";
  return "bg-status-up/50";
}

function UsageBar({ percent }: { percent: number }) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="h-1 min-w-0 flex-1 rounded-full bg-border">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${usageBarColor(width)}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function MetricRow({
  label,
  percent,
  value,
}: {
  label: string;
  percent: number;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-muted">{label}</span>
      <UsageBar percent={percent} />
      <span className="shrink-0 w-[145px] text-right text-foreground">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  const parts: string[] = [];

  if (duration.days) parts.push(`${duration.days}d`);
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (parts.length === 0) parts.push(`${duration.seconds ?? 0}s`);

  return parts.join(" ");
}

export function SystemInfoWidget() {
  const { data, status, error } = useSystemStats();

  if (status === "loading" && !data) {
    return (
      <div className="mb-4 rounded-lg border border-border px-4 py-3 font-console text-xs text-muted">
        System info
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="mb-4 rounded-lg border border-border px-4 py-3 font-console text-xs text-muted">
        {error?.message ?? "System info unavailable"}
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="mb-4 rounded-lg border border-border px-4 py-3 font-console text-xs">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-muted">System info</span>
          <div className="flex items-center gap-2">
            <span className="text-muted">Uptime {formatUptime(data.uptimeSeconds)}</span>
            <CacheStatusLabel status={status} />
          </div>
        </div>

        <div className="space-y-2">
          <MetricRow
            label="CPU"
            percent={data.cpuPercent}
            value={`${data.cpuPercent.toFixed(0)}%`}
          />
          <MetricRow
            label="RAM"
            percent={data.memoryPercent}
            value={`${formatBytes(data.memoryUsed)} / ${formatBytes(data.memoryTotal)}`}
          />
          <MetricRow
            label="Disk"
            percent={data.storagePercent}
            value={`${formatBytes(data.storageUsed)} / ${formatBytes(data.storageTotal)}`}
          />
          <MetricRow
            label="Network"
            percent={data.networkPercent}
            value={`↑ ${formatRate(data.networkTxRate)} · ↓ ${formatRate(data.networkRxRate)}`}
          // width={145}
          // value={<span>↑ {formatRate(data.networkTxRate)} <br />  ↓ {formatRate(data.networkRxRate)}</span>}
          />
        </div>
      </div>
    </FadeIn>
  );
}
