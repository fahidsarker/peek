export type AppExportItem = {
  title: string;
  iconUrl: string;
  publicUrl: string;
  pingUrl?: string;
};

export type AppsExportFile = {
  version: 1;
  apps: AppExportItem[];
};

type AppRow = {
  title: string;
  iconUrl: string;
  publicUrl: string;
  pingUrl: string | null;
};

export function exportAppsToFile(apps: AppRow[]) {
  const payload: AppsExportFile = {
    version: 1,
    apps: apps.map(({ title, iconUrl, publicUrl, pingUrl }) => ({
      title,
      iconUrl,
      publicUrl,
      ...(pingUrl ? { pingUrl } : {}),
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "peek-apps.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function parseAppsImportFile(
  text: string,
): { ok: true; apps: AppExportItem[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON file" };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("apps" in data) ||
    !Array.isArray((data as AppsExportFile).apps)
  ) {
    return { ok: false, error: "Invalid app list file" };
  }

  const { apps } = data as AppsExportFile;
  for (const app of apps) {
    if (
      typeof app !== "object" ||
      app === null ||
      typeof app.title !== "string" ||
      typeof app.iconUrl !== "string" ||
      typeof app.publicUrl !== "string" ||
      (app.pingUrl !== undefined && typeof app.pingUrl !== "string")
    ) {
      return { ok: false, error: "Invalid app list file" };
    }
  }

  return { ok: true, apps };
}

export async function importAppsFromFile(
  apps: AppExportItem[],
  mode: "replace" | "append",
): Promise<{ ok: true; imported: number } | { error: string }> {
  const res = await fetch("/api/admin/apps/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mode, apps }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Import failed" };
  return { ok: true, imported: data.imported ?? apps.length };
}
