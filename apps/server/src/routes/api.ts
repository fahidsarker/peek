import type { FastifyInstance } from "fastify";
import {
  createApp,
  deleteApp,
  deleteUser,
  getAdminData,
  importApps,
  reorderApps,
  toggleUserAdmin,
  toggleUserDocker,
  updateApp,
  updateSettings,
} from "../services/admin";
import { requireAdmin, requireAuth } from "../auth/middleware";
import { getAppsWithStatus } from "../services/ping";
import { getSettings } from "../services/settings";
import { getWeather, getWeatherConfig } from "../services/weather";
import { getDockerContainersDetailed, getDockerContainerDetail } from "../services/docker-containers";
import {
  pauseContainer,
  restartContainer,
  startContainer,
  stopContainer,
  unpauseContainer,
} from "../services/docker";
import { requireDocker } from "../auth/middleware";
import type { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function broadcastAppsStatus() {
  getAppsWithStatus(true).then((apps) => {
    io?.emit("apps:status", { apps });
  });
}

export function broadcastDockerContainers() {
  getDockerContainersDetailed()
    .then((containers) => {
      io?.to("docker:watchers").emit("docker:containers", { containers });
    })
    .catch(() => {});
}

export function broadcastSettings() {
  getSettings().then((settings) => {
    io?.emit("settings:updated", { settings });
  });
}

export async function registerApiRoutes(app: FastifyInstance) {
  app.get("/api/apps/status", async (request, reply) => {
    if (await requireAuth(request, reply)) return;
    const refresh = (request.query as { refresh?: string }).refresh === "true";
    const apps = await getAppsWithStatus(refresh);
    return reply.send({ apps });
  });

  app.get("/api/docker/containers", async (request, reply) => {
    if (await requireDocker(request, reply)) return;
    try {
      const containers = await getDockerContainersDetailed();
      return reply.send({ containers });
    } catch {
      return reply.status(503).send({ error: "Docker socket unavailable" });
    }
  });

  app.get("/api/docker/containers/:id", async (request, reply) => {
    if (await requireDocker(request, reply)) return;
    const { id } = request.params as { id: string };

    try {
      const container = await getDockerContainerDetail(id);
      return reply.send({ container });
    } catch {
      return reply.status(404).send({ error: "Container not found" });
    }
  });

  app.post("/api/docker/containers/:id/:action", async (request, reply) => {
    if (await requireDocker(request, reply)) return;
    if (!request.user?.isAdmin) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const { id, action } = request.params as { id: string; action: string };

    try {
      switch (action) {
        case "restart":
          await restartContainer(id);
          break;
        case "pause":
          await pauseContainer(id);
          break;
        case "unpause":
          await unpauseContainer(id);
          break;
        case "start":
          await startContainer(id);
          break;
        case "stop":
          await stopContainer(id);
          break;
        default:
          return reply.status(400).send({ error: "Invalid action" });
      }

      broadcastDockerContainers();
      return reply.send({ ok: true });
    } catch {
      return reply.status(500).send({ error: "Docker action failed" });
    }
  });

  app.get("/api/weather", async (request, reply) => {
    if (await requireAuth(request, reply)) return;

    const query = request.query as { lat?: string; lon?: string };
    const lat = query.lat ? Number(query.lat) : undefined;
    const lon = query.lon ? Number(query.lon) : undefined;
    const config = await getWeatherConfig();

    try {
      const weather = await getWeather({
        lat: Number.isFinite(lat) ? lat : undefined,
        lon: Number.isFinite(lon) ? lon : undefined,
      });
      return reply.send({ weather, useCurrentLocation: config.useCurrentLocation });
    } catch {
      return reply.send({ weather: null, useCurrentLocation: config.useCurrentLocation });
    }
  });

  app.get("/api/admin", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const data = await getAdminData();
    return reply.send(data);
  });

  app.post("/api/admin/apps", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const result = await createApp(request.user!, request.body);
    if ("error" in result) return reply.status(400).send(result);
    broadcastAppsStatus();
    return reply.send(result);
  });

  app.post("/api/admin/apps/import", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const result = await importApps(request.user!, request.body);
    if ("error" in result) return reply.status(400).send(result);
    broadcastAppsStatus();
    return reply.send(result);
  });

  app.patch("/api/admin/apps/:id", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const result = await updateApp(request.user!, id, request.body);
    if ("error" in result) return reply.status(400).send(result);
    broadcastAppsStatus();
    return reply.send(result);
  });

  app.delete("/api/admin/apps/:id", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    await deleteApp(id);
    broadcastAppsStatus();
    return reply.send({ ok: true });
  });

  app.put("/api/admin/apps/reorder", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const { orderedIds } = request.body as { orderedIds: string[] };
    const result = await reorderApps(request.user!, orderedIds);
    if ("error" in result) return reply.status(400).send(result);
    broadcastAppsStatus();
    return reply.send(result);
  });

  app.patch("/api/admin/users/:id", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const body = request.body as { isAdmin?: boolean; showDocker?: boolean };

    if (body.isAdmin !== undefined) {
      const result = await toggleUserAdmin(request.user!, id, body.isAdmin);
      if ("error" in result) return reply.status(400).send(result);
    }
    if (body.showDocker !== undefined) {
      await toggleUserDocker(id, body.showDocker);
    }

    return reply.send({ ok: true });
  });

  app.delete("/api/admin/users/:id", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const result = await deleteUser(request.user!, id);
    if ("error" in result) return reply.status(400).send(result);
    return reply.send(result);
  });

  app.patch("/api/admin/settings", async (request, reply) => {
    if (await requireAdmin(request, reply)) return;
    const result = await updateSettings(request.user!, request.body);
    if ("error" in result) return reply.status(400).send(result);
    broadcastSettings();
    return reply.send(result);
  });
}
