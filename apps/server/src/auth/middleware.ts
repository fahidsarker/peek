import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getSessionTokenFromCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./cookies";
import {
  createSession,
  deleteSessionByToken,
  getSessionByToken,
  type AuthSession,
  type AuthUser,
} from "./sessions";

declare module "fastify" {
  interface FastifyRequest {
    authSession: AuthSession | null;
    user: AuthUser | null;
  }
}

export async function loadSession(
  request: FastifyRequest,
): Promise<AuthSession | null> {
  const token = getSessionTokenFromCookie(request.headers.cookie);
  if (!token) return null;
  return getSessionByToken(token);
}

export async function attachSession(request: FastifyRequest) {
  const authSession = await loadSession(request);
  request.authSession = authSession;
  request.user = authSession?.user ?? null;
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await attachSession(request);
  if (!request.user) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await attachSession(request);
  if (!request.user) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  if (!request.user.isAdmin) {
    return reply.status(403).send({ error: "Forbidden" });
  }
}

export async function requireDocker(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await attachSession(request);
  if (!request.user) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  if (!request.user.showDocker) {
    return reply.status(403).send({ error: "Forbidden" });
  }
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function loginUser(
  reply: FastifyReply,
  userId: string,
): Promise<void> {
  const token = await createSession(userId);
  setSessionCookie(reply, token);
}

export async function logoutUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = getSessionTokenFromCookie(request.headers.cookie);
  if (token) {
    await deleteSessionByToken(token);
  }
  clearSessionCookie(reply);
}

export { getSessionByToken, type AuthSession, type AuthUser };
