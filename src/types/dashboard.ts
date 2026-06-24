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
