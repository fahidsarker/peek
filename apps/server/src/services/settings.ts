import { count, eq } from "drizzle-orm";
import { db, settings, user } from "@peek/db";

export async function ensureSettings() {
  const existing = await db.query.settings.findFirst({
    where: eq(settings.id, 1),
  });

  if (!existing) {
    await db.insert(settings).values({ id: 1 });
  }
}

export async function getSettings() {
  await ensureSettings();
  const row = await db.query.settings.findFirst({
    where: eq(settings.id, 1),
  });
  return row!;
}

export async function isSignupsAllowed() {
  const row = await getSettings();
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count === 0) {
    return true;
  }
  return row.allowSignups;
}
