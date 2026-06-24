"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";

type AppItem = {
  id: string;
  title: string;
  iconUrl: string;
  publicUrl: string;
  lastPingStatus: string;
};

function statusColor(status: string) {
  if (status === "up") return "bg-status-up";
  if (status === "down") return "bg-status-down";
  return "bg-status-unknown";
}

export function AppList() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apps/status?refresh=true")
      .then((res) => res.json())
      .then((data) => setApps(data.apps ?? []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
            <div className="relative size-4 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
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
