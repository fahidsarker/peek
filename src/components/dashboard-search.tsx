"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppsStatus } from "@/lib/queries/apps";
import { useDockerContainers } from "@/lib/queries/docker";
import { dockerAvatarRingClass, getInitials } from "@/lib/initials";
import type { AppItem, ContainerItem } from "@/types/dashboard";

type SearchResult =
  | { type: "app"; app: AppItem }
  | { type: "docker"; container: ContainerItem }
  | { type: "admin" };

function statusColor(status: string) {
  if (status === "up") return "bg-status-up";
  if (status === "down") return "bg-status-down";
  return "bg-status-unknown";
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function buildResults(
  apps: AppItem[],
  containers: ContainerItem[],
  query: string,
  showDocker: boolean,
): SearchResult[] {
  const q = query.trim();
  const results: SearchResult[] = [];

  for (const app of apps) {
    if (!q || matchesQuery(app.title, q) || matchesQuery(app.publicUrl, q)) {
      results.push({ type: "app", app });
    }
  }

  if (showDocker) {
    for (const container of containers) {
      if (!q || matchesQuery(container.name, q)) {
        results.push({ type: "docker", container });
      }
    }
  }

  if (
    !q ||
    matchesQuery("settings", q) ||
    matchesQuery("admin", q) ||
    matchesQuery("admin settings", q)
  ) {
    results.push({ type: "admin" });
  }

  return results;
}

function groupResults(results: SearchResult[]) {
  const groups: { label: string; items: SearchResult[] }[] = [];
  const apps = results.filter((r) => r.type === "app");
  const docker = results.filter((r) => r.type === "docker");
  const nav = results.filter((r) => r.type === "admin");

  if (apps.length > 0) groups.push({ label: "Apps", items: apps });
  if (docker.length > 0) groups.push({ label: "Docker", items: docker });
  if (nav.length > 0) groups.push({ label: "Navigation", items: nav });

  return groups;
}

export function DashboardSearch({
  showDocker,
}: {
  showDocker: boolean;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const { data: apps = [], isPending: appsPending } = useAppsStatus({
    enabled: open,
  });
  const { data: containers = [], isPending: containersPending } =
    useDockerContainers({
      enabled: open && showDocker,
    });

  const loading =
    appsPending || (showDocker && containersPending);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const results = useMemo(
    () => buildResults(apps, containers, query, showDocker),
    [apps, containers, query, showDocker],
  );

  const groups = useMemo(() => groupResults(results), [results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
    triggerRef.current?.focus();
  }, []);

  const activate = useCallback(
    (result: SearchResult) => {
      if (result.type === "app") {
        window.open(result.app.publicUrl, "_blank", "noopener,noreferrer");
      } else if (result.type === "docker") {
        document
          .getElementById(`docker-${result.container.id}`)
          ?.scrollIntoView({ block: "nearest" });
      } else if (result.type === "admin") {
        router.push("/settings");
      }
      close();
    },
    [close, router],
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) =>
          results.length === 0 ? 0 : (i + 1) % results.length,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          results.length === 0
            ? 0
            : (i - 1 + results.length) % results.length,
        );
        return;
      }

      if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        activate(results[selectedIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, results, selectedIndex, activate]);

  let flatIndex = 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-3 rounded-full border border-border px-4 font-console text-sm text-muted transition-opacity hover:opacity-80"
      >
        <span>Search...</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps, containers..."
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
            />

            <div className="scrollbar-hidden max-h-80 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 font-console text-sm text-muted">
                  Loading...
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 font-console text-sm text-muted">
                  No results
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.label}>
                    <p className="px-4 py-2 font-console text-xs text-muted">
                      {group.label}
                    </p>
                    <ul className="divide-y divide-border">
                      {group.items.map((result) => {
                        const index = flatIndex++;
                        const selected = index === selectedIndex;

                        return (
                          <li key={`${result.type}-${index}`}>
                            <button
                              type="button"
                              onClick={() => activate(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                selected ? "bg-border/40" : "hover:bg-border/20"
                              }`}
                            >
                              {result.type === "app" && (
                                <>
                                  <div className="relative size-4 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                                    <Image
                                      src={result.app.iconUrl}
                                      alt=""
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">
                                      {result.app.title}
                                    </p>
                                    <p className="truncate font-console text-xs text-muted">
                                      {result.app.publicUrl}
                                    </p>
                                  </div>
                                  <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(result.app.lastPingStatus)}`}
                                  />
                                </>
                              )}

                              {result.type === "docker" && (
                                <>
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background font-console text-xs text-muted ${dockerAvatarRingClass(result.container.state)}`}
                                  >
                                    {getInitials(result.container.name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">
                                      {result.container.name}
                                    </p>
                                    <p className="font-console text-xs text-muted">
                                      {result.container.state}
                                    </p>
                                  </div>
                                </>
                              )}

                              {result.type === "admin" && (
                                <>
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background font-console text-sm text-muted">
                                    ⚙
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">
                                      Settings
                                    </p>
                                    <p className="font-console text-xs text-muted">
                                      /settings
                                    </p>
                                  </div>
                                </>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
