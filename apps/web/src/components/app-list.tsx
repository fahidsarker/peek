import { FadeIn } from "@/components/fade-in";
import { CacheStatusLabel } from "@/components/cache-status-label";
import { useAppsStatus } from "@/lib/hooks/use-apps-status";

function statusColor(status: string) {
  if (status === "up") return "bg-status-up";
  if (status === "down") return "bg-status-down";
  return "bg-status-unknown";
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(status)}`}
      title={status}
    />
  );
}

export function AppList({ compact = true }: { compact?: boolean }) {
  const { data: apps = [], status } = useAppsStatus();

  if (status === "loading" && apps.length === 0) {
    return <p className="font-console text-sm text-muted">Loading apps...</p>;
  }

  if (apps.length === 0) {
    return (
      <p className="font-console text-sm text-muted">
        No apps yet. Add some in the admin panel.
      </p>
    );
  }

  return (
    <FadeIn className="divide-y divide-border">
      {apps.map((app) =>
        compact ? (
          <a
            key={app.id}
            href={app.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 py-2.5 transition-opacity hover:opacity-80 md:py-2"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <img
                src={app.iconUrl}
                alt=""
                className="size-4 shrink-0 object-cover"
              />
              <p className="truncate text-sm">{app.title}</p>
            </div>
            <p className="hidden truncate font-console text-xs text-muted md:block">
              {app.publicUrl}
            </p>
            <StatusDot status={app.lastPingStatus} />
          </a>
        ) : (
          <a
            key={app.id}
            href={app.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 py-4 transition-opacity hover:opacity-80"
          >
            <img
              src={app.iconUrl}
              alt=""
              className="ml-2 h-10 w-10 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{app.title}</p>
              <p className="truncate font-console text-xs text-muted">
                {app.publicUrl}
              </p>
            </div>
            <StatusDot status={app.lastPingStatus} />
          </a>
        ),
      )}
    </FadeIn>
  );
}

export function AppListHeader() {
  const { status } = useAppsStatus();
  return <CacheStatusLabel status={status} />;
}
