import type { DataStatus } from "@/lib/cache/store";

export function CacheStatusLabel({ status }: { status: DataStatus }) {
  if (status !== "stale") return null;
  return (
    <span className="font-console text-xs text-muted">Updating…</span>
  );
}
