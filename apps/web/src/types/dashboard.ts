export type AppItem = {
  id: string;
  title: string;
  iconUrl: string;
  publicUrl: string;
  lastPingStatus: string;
};

export type ContainerItem = {
  id: string;
  name: string;
  state: string;
  runningFor: string | null;
};

export type SystemMetrics = {
  cpuPercent: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  ramPercent: number;
  diskFreeBytes: number;
  diskTotalBytes: number;
  netRxBytesPerSec: number | null;
  netTxBytesPerSec: number | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  showDocker: boolean;
};

export type SessionResponse = {
  user: AuthUser | null;
  settings?: {
    appsCompactView: boolean;
    allowSignups: boolean;
  };
};
