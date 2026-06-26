import type { Socket } from "socket.io";
import { getSessionTokenFromCookie } from "./cookies";
import { getSessionByToken, type AuthSession } from "./sessions";

declare module "socket.io" {
  interface Socket {
    authSession: AuthSession;
  }
}

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  const token = getSessionTokenFromCookie(socket.handshake.headers.cookie);
  if (!token) {
    return next(new Error("Unauthorized"));
  }

  const authSession = await getSessionByToken(token);
  if (!authSession) {
    return next(new Error("Unauthorized"));
  }

  socket.authSession = authSession;
  next();
}
