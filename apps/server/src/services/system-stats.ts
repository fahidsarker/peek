import si from "systeminformation";

export type SystemStats = {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsed: number;
  memoryTotal: number;
  uptimeSeconds: number;
  storagePercent: number;
  storageUsed: number;
  storageTotal: number;
  networkRxRate: number;
  networkTxRate: number;
  networkPercent: number;
};

const DEFAULT_LINK_SPEED_BYTES_PER_SEC = 1_000_000_000 / 8; // 1 Gbps

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function pickRootFilesystem(
  filesystems: Awaited<ReturnType<typeof si.fsSize>>,
) {
  const root =
    filesystems.find((fs) => fs.mount === "/" || fs.mount === "C:") ??
    filesystems.find((fs) => fs.mount === "C:\\") ??
    filesystems[0];

  return root ?? null;
}

async function getLinkSpeedBytesPerSec(): Promise<number> {
  try {
    const defaultIface = await si.networkInterfaceDefault();
    const interfaces = await si.networkInterfaces();
    const iface = interfaces.find((item) => item.iface === defaultIface);
    if (iface?.speed && iface.speed > 0) {
      return (iface.speed * 1_000_000) / 8;
    }
  } catch {
    // fall through to default cap
  }
  return DEFAULT_LINK_SPEED_BYTES_PER_SEC;
}

export async function getSystemStats(): Promise<SystemStats> {
  const [load, memory, time, filesystems, networkStats, networkInterfaces, linkSpeed] =
    await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.time(),
      si.fsSize(),
      si.networkStats(),
      si.networkInterfaces(),
      getLinkSpeedBytesPerSec(),
    ]);

  const cpuPercent = clampPercent(load.currentLoad);
  const memoryTotal = memory.total;
  const memoryUsed = memory.active;
  const memoryPercent = clampPercent(
    memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0,
  );

  const rootFs = pickRootFilesystem(filesystems);
  const storageTotal = rootFs?.size ?? 0;
  const storageUsed = rootFs?.used ?? 0;
  const storagePercent = clampPercent(
    storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0,
  );

  const internalIfaces = new Set(
    networkInterfaces
      .filter((iface) => iface.internal)
      .map((iface) => iface.iface),
  );

  const activeNetwork =
    networkStats.find(
      (iface) => iface.operstate === "up" && !internalIfaces.has(iface.iface),
    ) ?? networkStats[0];

  const networkRxRate = activeNetwork?.rx_sec ?? 0;
  const networkTxRate = activeNetwork?.tx_sec ?? 0;
  const networkTotalRate = networkRxRate + networkTxRate;
  const networkPercent = clampPercent(
    linkSpeed > 0 ? (networkTotalRate / linkSpeed) * 100 : 0,
  );

  return {
    cpuPercent,
    memoryPercent,
    memoryUsed,
    memoryTotal,
    uptimeSeconds: time.uptime,
    storagePercent,
    storageUsed,
    storageTotal,
    networkRxRate,
    networkTxRate,
    networkPercent,
  };
}
