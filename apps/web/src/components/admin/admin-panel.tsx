import { useEffect, useRef, useState } from "react";
import { SortableAppList } from "@/components/admin/sortable-app-list";
import { FadeIn } from "@/components/fade-in";
import {
  exportAppsToFile,
  importAppsFromFile,
  parseAppsImportFile,
} from "@/lib/apps-import-export";
import { useAdminData } from "@/lib/hooks/use-admin-data";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiPatch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export function AdminPanel({ currentUserId }: { currentUserId: string }) {
  const { data: adminData, refresh } = useAdminData();
  const [message, setMessage] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [pending, setPending] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const importInputRef = useRef<HTMLInputElement>(null);

  const settings = adminData?.settings;
  const apps = adminData?.apps ?? [];
  const users = adminData?.users ?? [];

  useEffect(() => {
    setUseCurrentLocation(settings?.weatherUseCurrentLocation ?? false);
  }, [settings?.weatherUseCurrentLocation]);

  if (!adminData) {
    return <p className="font-console text-sm text-muted">Loading admin...</p>;
  }

  return (
    <FadeIn className="space-y-12">
      {message && (
        <p className="font-console text-xs text-muted">{message}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-console text-sm text-muted">Apps</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportAppsToFile(apps)}
            className="rounded border border-border px-4 py-2 font-console text-sm"
          >
            Export
          </button>
          <div>
            <span className="font-console text-xs text-muted">|</span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => importInputRef.current?.click()}
            className="rounded border border-border px-4 py-2 font-console text-sm disabled:opacity-50"
          >
            Import
          </button>
          <select
            value={importMode}
            onChange={(e) =>
              setImportMode(e.target.value as "replace" | "append")
            }
            className="rounded border border-border bg-surface px-3 py-2 font-console text-sm"
          >
            <option value="append">Append</option>
            <option value="replace">Replace</option>
          </select>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;

              if (
                importMode === "replace" &&
                !window.confirm(
                  "Replace the current app list with the imported file? This cannot be undone.",
                )
              ) {
                return;
              }

              setPending(true);
              const text = await file.text();
              const parsed = parseAppsImportFile(text);
              if (!parsed.ok) {
                setMessage(parsed.error);
                setPending(false);
                return;
              }

              const result = await importAppsFromFile(parsed.apps, importMode);
              setMessage(
                "error" in result
                  ? result.error
                  : `Imported ${result.imported} app${result.imported === 1 ? "" : "s"}`,
              );
              await refresh();
              setPending(false);
            }}
          />
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const form = new FormData(e.currentTarget);
            const result = await apiPost("/api/admin/apps", {
              title: form.get("title"),
              iconUrl: form.get("iconUrl"),
              publicUrl: form.get("publicUrl"),
              pingUrl: form.get("pingUrl") || "",
            });
            setMessage(result.error ?? "App created");
            e.currentTarget.reset();
            await refresh();
            setPending(false);
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
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-border px-4 py-2 font-console text-sm"
          >
            Add app
          </button>
        </form>

        <div className="divide-y divide-border rounded-lg border border-border">
          <SortableAppList
            apps={apps}
            onMessage={setMessage}
            onRefresh={refresh}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-console text-sm text-muted">Users</h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
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
                      const result = await apiPatch(`/api/admin/users/${u.id}`, {
                        isAdmin: e.target.checked,
                      });
                      if (result.error) setMessage(result.error);
                      await refresh();
                    }}
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={u.showDocker}
                    onChange={async (e) => {
                      await apiPatch(`/api/admin/users/${u.id}`, {
                        showDocker: e.target.checked,
                      });
                      await refresh();
                    }}
                  />
                  Docker
                </label>
                {u.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await apiDelete(`/api/admin/users/${u.id}`);
                      if (result.error) setMessage(result.error);
                      await refresh();
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
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const form = new FormData(e.currentTarget);
            const result = await apiPatch("/api/admin/settings", {
              allowSignups: form.get("allowSignups") === "on",
              appsCompactView: form.get("appsCompactView") === "on",
              weatherProvider: form.get("weatherProvider"),
              weatherUseCurrentLocation:
                form.get("weatherUseCurrentLocation") === "on",
              weatherCity: form.get("weatherCity") || undefined,
              weatherLat: form.get("weatherLat")
                ? Number(form.get("weatherLat"))
                : undefined,
              weatherLon: form.get("weatherLon")
                ? Number(form.get("weatherLon"))
                : undefined,
              openWeatherApiKey: form.get("openWeatherApiKey") || undefined,
            });
            setMessage(result.error ?? "Settings saved");
            await refresh();
            setPending(false);
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

          <label className="flex items-center gap-2 font-console text-sm">
            <input
              type="checkbox"
              name="appsCompactView"
              defaultChecked={settings?.appsCompactView ?? true}
            />
            Compact app list
          </label>

          <label className="block space-y-1">
            <span className="font-console text-xs text-muted">
              Weather provider
            </span>
            <select
              name="weatherProvider"
              defaultValue={settings?.weatherProvider ?? "open-meteo"}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="open-meteo">Open-Meteo</option>
              <option value="openweather">OpenWeatherMap</option>
            </select>
          </label>

          <label className="flex items-center gap-2 font-console text-sm">
            <input
              type="checkbox"
              name="weatherUseCurrentLocation"
              checked={useCurrentLocation}
              onChange={(e) => setUseCurrentLocation(e.target.checked)}
            />
            Use current location
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="weatherCity"
              placeholder="City label"
              defaultValue={settings?.weatherCity ?? ""}
              disabled={useCurrentLocation}
              className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
            />
            <input
              name="weatherLat"
              type="number"
              step="any"
              placeholder="Latitude"
              defaultValue={settings?.weatherLat ?? ""}
              disabled={useCurrentLocation}
              className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
            />
            <input
              name="weatherLon"
              type="number"
              step="any"
              placeholder="Longitude"
              defaultValue={settings?.weatherLon ?? ""}
              disabled={useCurrentLocation}
              className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
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
