import { readFile, statfs } from "node:fs/promises";
import type { SystemStats } from "./system-stats.types";

const DEFAULT_LINK_SPEED_BYTES_PER_SEC = 1_000_000_000 / 8; // 1 Gbps

type NetworkSample = {
  rxBytes: number;
  txBytes: number;
  timestamp: number;
};

type CpuSample = {
  idle: number;
  total: number;
};

let prevNetworkSample: NetworkSample | null = null;
let prevCpuSample: CpuSample | null = null;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function isVirtualInterface(name: string): boolean {
  return (
    name === "lo" ||
    name.startsWith("docker") ||
    name.startsWith("veth") ||
    name.startsWith("br-") ||
    name.startsWith("virbr")
  );
}

async function readHostFile(root: string, relativePath: string): Promise<string> {
  return readFile(`${root}/${relativePath}`, "utf8");
}

function parseNetworkBytes(content: string) {
  const interfaces = new Map<string, { rxBytes: number; txBytes: number }>();

  for (const line of content.split("\n")) {
    const match = line.trim().match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;

    const name = match[1]!.trim();
    if (isVirtualInterface(name)) continue;

    const fields = match[2]!.trim().split(/\s+/).map(Number);
    if (fields.length < 16) continue;

    interfaces.set(name, {
      rxBytes: fields[0] ?? 0,
      txBytes: fields[8] ?? 0,
    });
  }

  let rxBytes = 0;
  let txBytes = 0;
  for (const iface of interfaces.values()) {
    rxBytes += iface.rxBytes;
    txBytes += iface.txBytes;
  }

  return { rxBytes, txBytes, interfaces };
}

function computeNetworkRates(
  current: NetworkSample,
  previous: NetworkSample | null,
): { rxRate: number; txRate: number } {
  if (!previous) {
    return { rxRate: 0, txRate: 0 };
  }

  const elapsedSec = (current.timestamp - previous.timestamp) / 1000;
  if (elapsedSec <= 0) {
    return { rxRate: 0, txRate: 0 };
  }

  const rxRate = Math.max(0, (current.rxBytes - previous.rxBytes) / elapsedSec);
  const txRate = Math.max(0, (current.txBytes - previous.txBytes) / elapsedSec);

  return { rxRate, txRate };
}

async function getHostLinkSpeedBytesPerSec(
  sysRoot: string | undefined,
  interfaces: Map<string, { rxBytes: number; txBytes: number }>,
): Promise<number> {
  if (!sysRoot) {
    return DEFAULT_LINK_SPEED_BYTES_PER_SEC;
  }

  let totalMbps = 0;

  for (const name of interfaces.keys()) {
    try {
      const speed = await readFile(`${sysRoot}/class/net/${name}/speed`, "utf8");
      const mbps = Number.parseInt(speed.trim(), 10);
      if (Number.isFinite(mbps) && mbps > 0) {
        totalMbps += mbps;
      }
    } catch {
      // skip interfaces without a reported link speed
    }
  }

  if (totalMbps > 0) {
    return (totalMbps * 1_000_000) / 8;
  }

  return DEFAULT_LINK_SPEED_BYTES_PER_SEC;
}

function parseCpuPercent(statContent: string): number {
  const cpuLine = statContent
    .split("\n")
    .find((line) => line.startsWith("cpu "));

  if (!cpuLine) return 0;

  const times = cpuLine
    .trim()
    .split(/\s+/)
    .slice(1)
    .map((value) => Number.parseInt(value, 10));

  const idle = (times[3] ?? 0) + (times[4] ?? 0);
  const total = times.reduce((sum, value) => sum + value, 0);
  const current: CpuSample = { idle, total };

  if (!prevCpuSample) {
    prevCpuSample = current;
    return 0;
  }

  const idleDelta = current.idle - prevCpuSample.idle;
  const totalDelta = current.total - prevCpuSample.total;
  prevCpuSample = current;

  if (totalDelta <= 0) return 0;

  return clampPercent((1 - idleDelta / totalDelta) * 100);
}

function parseMemory(meminfoContent: string) {
  const values = new Map<string, number>();

  for (const line of meminfoContent.split("\n")) {
    const match = line.match(/^([A-Za-z]+):\s+(\d+)/);
    if (!match) continue;
    values.set(match[1]!, Number.parseInt(match[2]!, 10) * 1024);
  }

  const memoryTotal = values.get("MemTotal") ?? 0;
  const memoryAvailable =
    values.get("MemAvailable") ??
    (values.get("MemFree") ?? 0) +
      (values.get("Buffers") ?? 0) +
      (values.get("Cached") ?? 0);
  const memoryUsed = Math.max(0, memoryTotal - memoryAvailable);
  const memoryPercent = clampPercent(
    memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0,
  );

  return { memoryTotal, memoryUsed, memoryPercent };
}

function parseUptime(uptimeContent: string): number {
  const uptime = Number.parseFloat(uptimeContent.trim().split(/\s+/)[0] ?? "0");
  return Number.isFinite(uptime) ? uptime : 0;
}

async function getHostStorage(rootfs: string) {
  const stats = await statfs(rootfs);
  const blockSize = Number(stats.bsize);
  const totalBlocks = Number(stats.blocks);
  const freeBlocks = Number(stats.bfree);

  const storageTotal = totalBlocks * blockSize;
  const storageUsed = Math.max(0, (totalBlocks - freeBlocks) * blockSize);
  const storagePercent = clampPercent(
    storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0,
  );

  return { storageTotal, storageUsed, storagePercent };
}

export async function getHostSystemStats(): Promise<SystemStats> {
  const procRoot = process.env.HOST_PROC_ROOT;
  if (!procRoot) {
    throw new Error("HOST_PROC_ROOT is not set");
  }

  const sysRoot = process.env.HOST_SYS_ROOT;
  const rootfs = process.env.HOST_ROOTFS;

  const [netDevContent, statContent, meminfoContent, uptimeContent] =
    await Promise.all([
      readHostFile(procRoot, "net/dev"),
      readHostFile(procRoot, "stat"),
      readHostFile(procRoot, "meminfo"),
      readHostFile(procRoot, "uptime"),
    ]);

  const cpuPercent = parseCpuPercent(statContent);
  const { memoryTotal, memoryUsed, memoryPercent } = parseMemory(meminfoContent);
  const uptimeSeconds = parseUptime(uptimeContent);

  const { rxBytes, txBytes, interfaces } = parseNetworkBytes(netDevContent);
  const currentNetworkSample: NetworkSample = {
    rxBytes,
    txBytes,
    timestamp: Date.now(),
  };
  const { rxRate, txRate } = computeNetworkRates(
    currentNetworkSample,
    prevNetworkSample,
  );
  prevNetworkSample = currentNetworkSample;

  const linkSpeed = await getHostLinkSpeedBytesPerSec(sysRoot, interfaces);
  const networkTotalRate = rxRate + txRate;
  const networkPercent = clampPercent(
    linkSpeed > 0 ? (networkTotalRate / linkSpeed) * 100 : 0,
  );

  let storageTotal = 0;
  let storageUsed = 0;
  let storagePercent = 0;

  if (rootfs) {
    try {
      const storage = await getHostStorage(rootfs);
      storageTotal = storage.storageTotal;
      storageUsed = storage.storageUsed;
      storagePercent = storage.storagePercent;
    } catch {
      // leave storage at zero when host rootfs is unavailable
    }
  }

  return {
    cpuPercent,
    memoryPercent,
    memoryUsed,
    memoryTotal,
    uptimeSeconds,
    storagePercent,
    storageUsed,
    storageTotal,
    networkRxRate: rxRate,
    networkTxRate: txRate,
    networkPercent,
  };
}
