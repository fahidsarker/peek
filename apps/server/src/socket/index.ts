import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "../auth/socket";
import { getAppsWithStatus } from "../services/ping";
import { getDockerContainersDetailed } from "../services/docker-containers";
import { getSettings } from "../services/settings";
import {
  broadcastAppsStatus,
  broadcastDockerContainers,
  setSocketServer,
} from "../routes/api";

const DOCKER_INTERVAL_MS = 15_000;
const APPS_INTERVAL_MS = 60_000;

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
  });

  setInterval(() => {
    broadcastDockerContainers();
  }, DOCKER_INTERVAL_MS);

  setInterval(() => {
    broadcastAppsStatus();
  }, APPS_INTERVAL_MS);

  return io;
}
