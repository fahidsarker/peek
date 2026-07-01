import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "../auth/socket";
import { getAppsWithStatus } from "../services/ping";
import { getDockerContainersDetailed } from "../services/docker-containers";
import { getSettings } from "../services/settings";
import {
  broadcastAppsStatus,
  broadcastDockerContainers,
  broadcastSystemStats,
  setSocketServer,
} from "../routes/api";

const DOCKER_INTERVAL_MS = 15_000;
const APPS_INTERVAL_MS = 60_000;
const SYSTEM_INTERVAL_MS = 2_000;

export function createSocketServer(httpServer: HttpServer) {
  const clientOrigin = process.env.APP_URL ?? "http://localhost:5173";

  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  setSocketServer(io);

  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const { user } = socket.authSession;

    const apps = await getAppsWithStatus(true);
    socket.emit("apps:status", { apps });

    if (user.showDocker) {
      socket.join("docker:watchers");
      try {
        const containers = await getDockerContainersDetailed();
        socket.emit("docker:containers", { containers });
      } catch {
        socket.emit("docker:containers", { containers: [] });
      }
    }

    const settings = await getSettings();
    socket.emit("settings:updated", { settings });

    if (settings.showSystemInfo) {
      try {
        const { getSystemStats } = await import("../services/system-stats");
        const stats = await getSystemStats();
        socket.emit("system:stats", { stats });
      } catch {
        // omit initial stats on failure
      }
    }
  });

  setInterval(() => {
    broadcastSystemStats();
  }, SYSTEM_INTERVAL_MS);

  setInterval(() => {
    broadcastDockerContainers();
  }, DOCKER_INTERVAL_MS);

  setInterval(() => {
    broadcastAppsStatus();
  }, APPS_INTERVAL_MS);

  return io;
}
