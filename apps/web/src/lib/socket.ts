import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io({
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
