import { asc, eq } from "drizzle-orm";
import { apps, db } from "@peek/db";

const PING_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60_000;

export type PingStatus = "up" | "down" | "unknown";

function isStale(lastPingAt: Date | null) {
  if (!lastPingAt) return true;
  return Date.now() - lastPingAt.getTime() > CACHE_TTL_MS;
}

async function pingUrl(url: string): Promise<PingStatus> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "unknown";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    return response.ok ? "up" : "down";
  } catch {
    return "down";
  }
}

export async function getAppsWithStatus(refresh = false) {
  const allApps = await db.query.apps.findMany({
    orderBy: [asc(apps.sortOrder), asc(apps.title)],
  });

  if (!refresh) {
    return allApps;
  }

  const staleApps = allApps.filter((app) => app.pingUrl && isStale(app.lastPingAt));
  if (staleApps.length === 0) {
    return allApps;
  }

  await Promise.all(
    staleApps.map(async (app) => {
      const status = app.pingUrl ? await pingUrl(app.pingUrl) : "unknown";
      await db
        .update(apps)
        .set({
          lastPingAt: new Date(),
          lastPingStatus: status,
        })
        .where(eq(apps.id, app.id));
    }),
  );

  return db.query.apps.findMany({
    orderBy: [asc(apps.sortOrder), asc(apps.title)],
  });
}
