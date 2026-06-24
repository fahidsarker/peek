"use server";

import { asc, count, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { apps, settings, user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { clearWeatherCache } from "@/lib/weather";

const appSchema = z.object({
  title: z.string().min(1),
  iconUrl: z.string().url(),
  publicUrl: z.string().url(),
  pingUrl: z.string().url().optional().or(z.literal("")),
});

export async function createApp(formData: FormData) {
  const session = await requireAdmin();

  const parsed = appSchema.safeParse({
    title: formData.get("title"),
    iconUrl: formData.get("iconUrl"),
    publicUrl: formData.get("publicUrl"),
    pingUrl: formData.get("pingUrl"),
  });

  if (!parsed.success) {
    return { error: "Invalid app data" };
  }

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
    createdBy: session.user.id,
    updatedBy: session.user.id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateApp(id: string, formData: FormData) {
  const session = await requireAdmin();

  const parsed = appSchema.safeParse({
    title: formData.get("title"),
    iconUrl: formData.get("iconUrl"),
    publicUrl: formData.get("publicUrl"),
    pingUrl: formData.get("pingUrl"),
  });

  if (!parsed.success) {
    return { error: "Invalid app data" };
  }

  await db
    .update(apps)
    .set({
      title: parsed.data.title,
      iconUrl: parsed.data.iconUrl,
      publicUrl: parsed.data.publicUrl,
      pingUrl: parsed.data.pingUrl || null,
      updatedBy: session.user.id,
    })
    .where(eq(apps.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteApp(id: string) {
  await requireAdmin();
  await db.delete(apps).where(eq(apps.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function reorderApps(orderedIds: string[]) {
  const session = await requireAdmin();

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
        .set({ sortOrder: index, updatedBy: session.user.id })
        .where(eq(apps.id, id)),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleUserAdmin(userId: string, isAdmin: boolean) {
  const session = await requireAdmin();
  if (session.user.id === userId && !isAdmin) {
    return { error: "Cannot remove your own admin access" };
  }

  await db.update(user).set({ isAdmin }).where(eq(user.id, userId));
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleUserDocker(userId: string, showDocker: boolean) {
  await requireAdmin();
  await db.update(user).set({ showDocker }).where(eq(user.id, userId));
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
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
  revalidatePath("/admin");
  return { ok: true };
}

const settingsSchema = z.object({
  allowSignups: z.coerce.boolean(),
  weatherProvider: z.enum(["open-meteo", "openweather"]),
  weatherUseCurrentLocation: z.coerce.boolean(),
  weatherCity: z.string().optional(),
  weatherLat: z.coerce.number().optional(),
  weatherLon: z.coerce.number().optional(),
  openWeatherApiKey: z.string().optional(),
});

export async function updateSettings(formData: FormData) {
  const session = await requireAdmin();

  const parsed = settingsSchema.safeParse({
    allowSignups: formData.get("allowSignups") === "on",
    weatherProvider: formData.get("weatherProvider"),
    weatherUseCurrentLocation: formData.get("weatherUseCurrentLocation") === "on",
    weatherCity: formData.get("weatherCity") || undefined,
    weatherLat:
      formData.get("weatherLat") && String(formData.get("weatherLat")).length > 0
        ? Number(formData.get("weatherLat"))
        : undefined,
    weatherLon:
      formData.get("weatherLon") && String(formData.get("weatherLon")).length > 0
        ? Number(formData.get("weatherLon"))
        : undefined,
    openWeatherApiKey: formData.get("openWeatherApiKey") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid settings" };
  }

  const current = await getSettings();

  await db
    .update(settings)
    .set({
      allowSignups: parsed.data.allowSignups,
      weatherProvider: parsed.data.weatherProvider,
      weatherUseCurrentLocation: parsed.data.weatherUseCurrentLocation,
      weatherCity: parsed.data.weatherCity ?? null,
      weatherLat: parsed.data.weatherLat ?? null,
      weatherLon: parsed.data.weatherLon ?? null,
      openWeatherApiKey: parsed.data.openWeatherApiKey || null,
      createdBy: current.createdBy ?? session.user.id,
      updatedBy: session.user.id,
    })
    .where(eq(settings.id, 1));

  clearWeatherCache();
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getAdminData() {
  await requireAdmin();

  const [allApps, allUsers, appSettings] = await Promise.all([
    db.query.apps.findMany({
      orderBy: [asc(apps.sortOrder), asc(apps.title)],
    }),
    db.query.user.findMany({
      orderBy: [asc(user.name)],
    }),
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
