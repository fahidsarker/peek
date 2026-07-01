import { useEffect } from "react";
import { useCachedData } from "../cache/use-cached-data";
import { getSocket } from "../socket";

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
  appsCompactView: boolean;
  showSystemInfo: boolean;
  weatherProvider: string;
  weatherUseCurrentLocation: boolean;
  weatherCity: string | null;
  weatherLat: number | null;
  weatherLon: number | null;
  openWeatherApiKey: string | null;
};

export type AdminData = {
  apps: AppRow[];
  users: UserRow[];
  settings: SettingsRow;
};

async function fetchAdminData(): Promise<AdminData> {
  const res = await fetch("/api/admin", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load admin data");
  return res.json();
}

export function useAdminData(enabled = true) {
  const result = useCachedData<AdminData>({
    key: "admin",
    fetcher: fetchAdminData,
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = () => {
      result.refresh();
    };

    socket.on("settings:updated", handler);
    socket.on("apps:status", handler);

    return () => {
      socket.off("settings:updated", handler);
      socket.off("apps:status", handler);
    };
  }, [enabled, result.refresh]);

  return result;
}
