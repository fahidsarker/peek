"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createApp,
  deleteApp,
  deleteUser,
  toggleUserAdmin,
  toggleUserDocker,
  updateSettings,
} from "@/app/admin/actions";
import { FadeIn } from "@/components/fade-in";

type AppRow = {
  id: string;
  title: string;
  iconUrl: string;
  publicUrl: string;
  pingUrl: string | null;
  sortOrder: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  showDocker: boolean;
};

type SettingsRow = {
  allowSignups: boolean;
  weatherProvider: string;
  weatherCity: string | null;
  weatherLat: number | null;
  weatherLon: number | null;
  openWeatherApiKey: string | null;
} | null;

export function AdminPanel({
  apps: initialApps,
  users,
  settings,
  currentUserId,
}: {
  apps: AppRow[];
  users: UserRow[];
  settings: SettingsRow;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <FadeIn className="space-y-12">
      {message && (
        <p className="font-console text-xs text-muted">{message}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-console text-sm text-muted">Apps</h2>
        <form
          action={async (formData) => {
            const result = await createApp(formData);
            setMessage(result.error ?? "App created");
            refresh();
          }}
          className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2"
        >
          <input
            name="title"
            placeholder="Title"
            required
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="iconUrl"
            placeholder="Icon URL"
            required
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="publicUrl"
            placeholder="Public URL"
            required
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="pingUrl"
            placeholder="Ping URL (optional)"
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="sortOrder"
            type="number"
            placeholder="Sort order"
            defaultValue={0}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-border px-4 py-2 font-console text-sm"
          >
            Add app
          </button>
        </form>

        <div className="divide-y divide-border rounded-lg border border-border">
          {initialApps.length === 0 ? (
            <p className="p-4 font-console text-sm text-muted">No apps yet.</p>
          ) : (
            initialApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{app.title}</p>
                  <p className="truncate font-console text-xs text-muted">
                    {app.publicUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteApp(app.id);
                    refresh();
                  }}
                  className="shrink-0 font-console text-xs text-status-down"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-console text-sm text-muted">Users</h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm">{u.name}</p>
                <p className="font-console text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex flex-wrap gap-3 font-console text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={u.isAdmin}
                    onChange={async (e) => {
                      const result = await toggleUserAdmin(u.id, e.target.checked);
                      if (result.error) setMessage(result.error);
                      refresh();
                    }}
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={u.showDocker}
                    onChange={async (e) => {
                      await toggleUserDocker(u.id, e.target.checked);
                      refresh();
                    }}
                  />
                  Docker
                </label>
                {u.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await deleteUser(u.id);
                      if (result.error) setMessage(result.error);
                      refresh();
                    }}
                    className="text-status-down"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-console text-sm text-muted">Settings</h2>
        <form
          action={async (formData) => {
            const result = await updateSettings(formData);
            setMessage(result.error ?? "Settings saved");
            refresh();
          }}
          className="space-y-4 rounded-lg border border-border p-4"
        >
          <label className="flex items-center gap-2 font-console text-sm">
            <input
              type="checkbox"
              name="allowSignups"
              defaultChecked={settings?.allowSignups ?? true}
            />
            Allow signups
          </label>

          <label className="block space-y-1">
            <span className="font-console text-xs text-muted">Weather provider</span>
            <select
              name="weatherProvider"
              defaultValue={settings?.weatherProvider ?? "open-meteo"}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="open-meteo">Open-Meteo</option>
              <option value="openweather">OpenWeatherMap</option>
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="weatherCity"
              placeholder="City label"
              defaultValue={settings?.weatherCity ?? ""}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              name="weatherLat"
              type="number"
              step="any"
              placeholder="Latitude"
              defaultValue={settings?.weatherLat ?? ""}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              name="weatherLon"
              type="number"
              step="any"
              placeholder="Longitude"
              defaultValue={settings?.weatherLon ?? ""}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <input
            name="openWeatherApiKey"
            placeholder="OpenWeather API key (optional)"
            defaultValue={settings?.openWeatherApiKey ?? ""}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={pending}
            className="rounded border border-border px-4 py-2 font-console text-sm"
          >
            Save settings
          </button>
        </form>
      </section>
    </FadeIn>
  );
}
