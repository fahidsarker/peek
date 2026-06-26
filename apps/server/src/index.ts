import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { registerAuthRoutes } from "./routes/auth";
import { registerApiRoutes } from "./routes/api";
import { createSocketServer } from "./socket";

const PORT = Number(process.env.PORT ?? 3000);
const clientOrigin = process.env.APP_URL ?? "http://localhost:5173";

async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(fastifyCookie, {
    secret: process.env.SESSION_SECRET ?? "dev-secret",
  });

  await app.register(fastifyCors, {
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await registerAuthRoutes(app);
  await registerApiRoutes(app);

  const webDist = join(import.meta.dir, "../../web/dist");
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
      decorateReply: true,
      setHeaders: (res, path) => {
        if (path.includes("/assets/")) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        } else if (path.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api") || request.url.startsWith("/socket.io")) {
        return reply.status(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}

const app = await buildApp();
await app.listen({ port: PORT, host: "0.0.0.0" });

createSocketServer(app.server);

console.log(`Server running on http://localhost:${PORT}`);
