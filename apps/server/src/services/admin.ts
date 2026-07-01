import { asc, count, eq, max } from "drizzle-orm";
import { apps, db, settings, user } from "@peek/db";
import { z } from "zod";
import type { AuthUser } from "../auth/middleware";
import { getSettings } from "./settings";
import { clearWeatherCache } from "./weather";

const appSchema = z.object({
  title: z.string().min(1),
  iconUrl: z.string().url(),
  publicUrl: z.string().url(),
  pingUrl: z.string().url().optional().or(z.literal("")),
});

export async function createApp(user: AuthUser, body: unknown) {
  const parsed = appSchema.safeParse(body);
  if (!parsed.success) return { error: "Invalid app data" };

  const [result] = await db.select({ maxOrder: max(apps.sortOrder) }).from(apps);
  const sortOrder = (result?.maxOrder ?? -1) + 1;
  const id = crypto.randomUUID();

  await db.insert(apps).values({
    id,
    title: parsed.data.title,
    iconUrl: parsed.data.iconUrl,
    publicUrl: parsed.data.publicUrl,
    pingUrl: parsed.data.pingUrl || null,
    sortOrder,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return { ok: true as const };
}

export async function updateApp(user: AuthUser, id: string, body: unknown) {
  const parsed = appSchema.safeParse(body);
  if (!parsed.success) return { error: "Invalid app data" };

  await db
    .update(apps)
    .set({
      title: parsed.data.title,
      iconUrl: parsed.data.iconUrl,
      publicUrl: parsed.data.publicUrl,
      pingUrl: parsed.data.pingUrl || null,
      updatedBy: user.id,
    })
    .where(eq(apps.id, id));

  return { ok: true as const };
}

export async function deleteApp(id: string) {
  await db.delete(apps).where(eq(apps.id, id));
  return { ok: true as const };
}

const importAppsSchema = z.object({
  mode: z.enum(["replace", "append"]),
  apps: z.array(appSchema),
});

function buildAppRows(
  parsedApps: z.infer<typeof appSchema>[],
  startSortOrder: number,
  userId: string,
) {
  return parsedApps.map((app, index) => ({
    id: crypto.randomUUID(),
    title: app.title,
    iconUrl: app.iconUrl,
    publicUrl: app.publicUrl,
    pingUrl: app.pingUrl || null,
    sortOrder: startSortOrder + index,
    createdBy: userId,
    updatedBy: userId,
  }));
}

export async function importApps(user: AuthUser, body: unknown) {
  const parsed = importAppsSchema.safeParse(body);
  if (!parsed.success) return { error: "Invalid app data" };

  const { mode, apps: parsedApps } = parsed.data;

  if (mode === "replace") {
    await db.transaction(async (tx) => {
      await tx.delete(apps);
      if (parsedApps.length > 0) {
        await tx.insert(apps).values(buildAppRows(parsedApps, 0, user.id));
      }
    });
  } else {
    const [result] = await db
      .select({ maxOrder: max(apps.sortOrder) })
      .from(apps);
    const startSortOrder = (result?.maxOrder ?? -1) + 1;
    if (parsedApps.length > 0) {
      await db
        .insert(apps)
        .values(buildAppRows(parsedApps, startSortOrder, user.id));
    }
  }

  return { ok: true as const, imported: parsedApps.length };
}

export async function reorderApps(user: AuthUser, orderedIds: string[]) {
  const existing = await db.query.apps.findMany({ columns: { id: true } });
  const existingIds = new Set(existing.map((a) => a.id));

  if (
    orderedIds.length !== existing.length ||
    !orderedIds.every((id) => existingIds.has(id))
  ) {
    return { error: "Invalid app order" };
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(apps)
        .set({ sortOrder: index, updatedBy: user.id })
        .where(eq(apps.id, id)),
    ),
  );

  return { ok: true as const };
}

export async function toggleUserAdmin(
  currentUser: AuthUser,
  userId: string,
  isAdmin: boolean,
) {
  if (currentUser.id === userId && !isAdmin) {
    return { error: "Cannot remove your own admin access" };
  }
  await db.update(user).set({ isAdmin }).where(eq(user.id, userId));
  return { ok: true as const };
}

export async function toggleUserDocker(userId: string, showDocker: boolean) {
  await db.update(user).set({ showDocker }).where(eq(user.id, userId));
  return { ok: true as const };
}

export async function deleteUser(currentUser: AuthUser, userId: string) {
  if (currentUser.id === userId) {
    return { error: "Cannot delete your own account" };
  }

  const [adminCount] = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.isAdmin, true));

  const target = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (target?.isAdmin && adminCount.count <= 1) {
    return { error: "Cannot delete the last admin" };
  }

  await db.delete(user).where(eq(user.id, userId));
  return { ok: true as const };
}

const settingsSchema = z.object({
  allowSignups: z.boolean(),
  appsCompactView: z.boolean(),
  showSystemInfo: z.boolean(),
  weatherProvider: z.enum(["open-meteo", "openweather"]),
  weatherUseCurrentLocation: z.boolean(),
  weatherCity: z.string().optional(),
  weatherLat: z.number().optional(),
  weatherLon: z.number().optional(),
  openWeatherApiKey: z.string().optional(),
});

export async function updateSettings(user: AuthUser, body: unknown) {
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return { error: "Invalid settings" };

  const current = await getSettings();

  await db
    .update(settings)
    .set({
      allowSignups: parsed.data.allowSignups,
      appsCompactView: parsed.data.appsCompactView,
      showSystemInfo: parsed.data.showSystemInfo,
      weatherProvider: parsed.data.weatherProvider,
      weatherUseCurrentLocation: parsed.data.weatherUseCurrentLocation,
      weatherCity: parsed.data.weatherCity ?? null,
      weatherLat: parsed.data.weatherLat ?? null,
      weatherLon: parsed.data.weatherLon ?? null,
      openWeatherApiKey: parsed.data.openWeatherApiKey || null,
      createdBy: current.createdBy ?? user.id,
      updatedBy: user.id,
    })
    .where(eq(settings.id, 1));

  clearWeatherCache();
  return { ok: true as const };
}

export async function getAdminData() {
  const [allApps, allUsers, appSettings] = await Promise.all([
    db.query.apps.findMany({
      orderBy: [asc(apps.sortOrder), asc(apps.title)],
    }),
    db.query.user.findMany({ orderBy: [asc(user.name)] }),
    getSettings(),
  ]);

  return {
    apps: allApps,
    users: allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      showDocker: u.showDocker,
    })),
    settings: appSettings,
  };
}
