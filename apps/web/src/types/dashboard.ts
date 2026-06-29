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

export type ContainerStats = {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
};

export type ContainerDetails = {
  id: string;
  shortId: string;
  name: string;
  image: string;
  state: string;
  status: string;
  startedAt: string | null;
  runningFor: string | null;
  stats: ContainerStats | null;
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
