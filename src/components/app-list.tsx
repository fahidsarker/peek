"use client";

import Image from "next/image";
import { FadeIn } from "@/components/fade-in";
import { useAppsStatus } from "@/lib/queries/apps";

function statusColor(status: string) {
  if (status === "up") return "bg-status-up";
  if (status === "down") return "bg-status-down";
  return "bg-status-unknown";
}

export function AppList() {
  const { data: apps = [], isPending } = useAppsStatus();

  if (isPending) {
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
      {apps.map((app) => (
        <a
          key={app.id}
          href={app.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 py-2 transition-opacity hover:opacity-80"
        >
          <div className="flex gap-2 items-center min-w-0 flex-1">
            <div className="relative size-4 shrink-0 overflow-hidden  ">
              <Image
                src={app.iconUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <p className="truncate text-sm">{app.title}</p>
          </div>
          <p className="truncate font-console text-xs text-muted">
            {app.publicUrl}
          </p>

          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(app.lastPingStatus)}`}
            title={app.lastPingStatus}
          />
        </a>
      ))}
    </FadeIn>
  );
}
