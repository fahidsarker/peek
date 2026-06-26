import { and, eq, gt } from "drizzle-orm";
import { db, session, user } from "@peek/db";
import { SESSION_MAX_AGE_MS } from "./cookies";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  showDocker: boolean;
};

export type AuthSession = {
  id: string;
  user: AuthUser;
};

function toAuthUser(row: typeof user.$inferSelect): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.isAdmin,
    showDocker: row.showDocker,
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.insert(session).values({
    id,
    token,
    userId,
    expiresAt,
  });

  return token;
}

export async function getSessionByToken(
  token: string,
): Promise<AuthSession | null> {
  const row = await db.query.session.findFirst({
    where: and(eq(session.token, token), gt(session.expiresAt, new Date())),
    with: { user: true },
  });

  if (!row?.user) return null;

  return {
    id: row.id,
    user: toAuthUser(row.user),
  };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.delete(session).where(eq(session.token, token));
}

export async function deleteSessionById(id: string): Promise<void> {
  await db.delete(session).where(eq(session.id, id));
}
