import { count, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, user } from "@peek/db";
import { hashPassword, verifyPassword } from "../auth/password";
import {
  attachSession,
  loginUser,
  logoutUser,
  requireAuth,
} from "../auth/middleware";
import { isSignupsAllowed } from "../services/settings";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/api/auth/session", async (request, reply) => {
    await attachSession(request);
    if (!request.user) {
      return reply.send({ user: null });
    }

    const settings = await import("../services/settings").then((m) =>
      m.getSettings(),
    );

    return reply.send({
      user: request.user,
      settings: {
        appsCompactView: settings.appsCompactView,
        allowSignups: settings.allowSignups,
      },
    });
  });

  app.get("/api/auth/signups-allowed", async (_request, reply) => {
    const allowed = await isSignupsAllowed();
    return reply.send({ allowed });
  });

  app.post("/api/auth/signup", async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid signup data" });
    }

    const allowed = await isSignupsAllowed();
    if (!allowed) {
      return reply.status(403).send({ error: "Signups are disabled" });
    }

    const existing = await db.query.user.findFirst({
      where: eq(user.email, parsed.data.email),
    });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(parsed.data.password);

    await db.insert(user).values({
      id,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });

    const [userCount] = await db.select({ count: count() }).from(user);
    if (userCount.count === 1) {
      await db
        .update(user)
        .set({ isAdmin: true, showDocker: true })
        .where(eq(user.id, id));
    }

    await loginUser(reply, id);
    return reply.send({ ok: true });
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid login data" });
    }

    const row = await db.query.user.findFirst({
      where: eq(user.email, parsed.data.email),
    });

    if (!row) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(parsed.data.password, row.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    await loginUser(reply, row.id);
    return reply.send({ ok: true });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await logoutUser(request, reply);
    return reply.send({ ok: true });
  });

  app.get("/api/me", async (request, reply) => {
    if (await requireAuth(request, reply)) return;

    const settings = await import("../services/settings").then((m) =>
      m.getSettings(),
    );

    return reply.send({
      user: request.user,
      settings: {
        appsCompactView: settings.appsCompactView,
      },
    });
  });
}
