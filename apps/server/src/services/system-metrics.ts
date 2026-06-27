import { statfs } from "node:fs/promises";
import os from "node:os";
import { readFile } from "node:fs/promises";

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

type CpuSample = { idle: number; total: number };
type NetSample = { rx: number; tx: number; at: number };

let prevCpu: CpuSample | null = null;
let prevNet: NetSample | null = null;

const DISK_PATH = process.env.SYSTEM_DISK_PATH ?? "/";

function readCpuTicks(): CpuSample {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const time of Object.values(cpu.times)) {
      total += time;
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

function calcCpuPercent(current: CpuSample): number {
  if (!prevCpu) return 0;

  const idleDiff = current.idle - prevCpu.idle;
  const totalDiff = current.total - prevCpu.total;
  if (totalDiff <= 0) return 0;

  return Math.round(100 * (1 - idleDiff / totalDiff));
}

function readRam(): Pick<SystemMetrics, "ramUsedBytes" | "ramTotalBytes" | "ramPercent"> {
  const ramTotalBytes = os.totalmem();
  const ramUsedBytes = ramTotalBytes - os.freemem();
  const ramPercent =
    ramTotalBytes === 0 ? 0 : Math.round((ramUsedBytes / ramTotalBytes) * 100);

  return { ramUsedBytes, ramTotalBytes, ramPercent };
}

async function readDisk(): Promise<Pick<SystemMetrics, "diskFreeBytes" | "diskTotalBytes">> {
  const stats = await statfs(DISK_PATH);
  const diskTotalBytes = stats.blocks * stats.bsize;
  const diskFreeBytes = stats.bfree * stats.bsize;
  return { diskFreeBytes, diskTotalBytes };
}

async function readNetworkBytes(): Promise<{ rx: number; tx: number } | null> {
  try {
    const content = await readFile("/proc/net/dev", "utf8");
    let rx = 0;
    let tx = 0;

    for (const line of content.split("\n").slice(2)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const colon = trimmed.indexOf(":");
      if (colon === -1) continue;

      const iface = trimmed.slice(0, colon).trim();
      if (iface === "lo") continue;

      const fields = trimmed
        .slice(colon + 1)
        .trim()
        .split(/\s+/);
      if (fields.length < 9) continue;

      rx += Number(fields[0]);
      tx += Number(fields[8]);
    }

    return { rx, tx };
  } catch {
    return null;
  }
}

function calcNetworkRates(
  current: { rx: number; tx: number },
  now: number,
): Pick<SystemMetrics, "netRxBytesPerSec" | "netTxBytesPerSec"> {
  if (!prevNet) {
    return { netRxBytesPerSec: 0, netTxBytesPerSec: 0 };
  }

  const elapsed = (now - prevNet.at) / 1000;
  if (elapsed <= 0) {
    return { netRxBytesPerSec: 0, netTxBytesPerSec: 0 };
  }

  return {
    netRxBytesPerSec: Math.max(0, (current.rx - prevNet.rx) / elapsed),
    netTxBytesPerSec: Math.max(0, (current.tx - prevNet.tx) / elapsed),
  };
}

// When Peek runs in Docker, metrics reflect the container cgroup unless host /proc is mounted.
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const now = Date.now();
  const cpuSample = readCpuTicks();
  const cpuPercent = calcCpuPercent(cpuSample);
  prevCpu = cpuSample;

  const ram = readRam();
  const disk = await readDisk();

  const netBytes = await readNetworkBytes();
  let netRxBytesPerSec: number | null = null;
  let netTxBytesPerSec: number | null = null;

  if (netBytes) {
    const rates = calcNetworkRates(netBytes, now);
    netRxBytesPerSec = rates.netRxBytesPerSec;
    netTxBytesPerSec = rates.netTxBytesPerSec;
    prevNet = { ...netBytes, at: now };
  } else {
    prevNet = null;
  }

  return {
    cpuPercent,
    ...ram,
    ...disk,
    netRxBytesPerSec,
    netTxBytesPerSec,
  };
}
