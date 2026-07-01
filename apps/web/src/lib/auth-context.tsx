import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SessionResponse } from "@/types/dashboard";
import { CacheProvider } from "./cache/cache-context";
import { clearUserCache } from "./cache/store";
import {
  clearSessionHint,
  writeSessionHint,
} from "./session-hint";
import { connectSocket, disconnectSocket, getSocket } from "./socket";

type AuthContextValue = {
  session: SessionResponse | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  return res.json();
}

function syncSessionHint(data: SessionResponse) {
  if (data.user) {
    writeSessionHint({
      name: data.user.name,
      showDocker: data.user.showDocker,
      appsCompactView: data.settings?.appsCompactView ?? true,
    });
  } else {
    clearSessionHint();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const data = await fetchSession();
    syncSessionHint(data);
    setSession(data);
    return;
  }, []);

  useEffect(() => {
    fetchSession()
      .then((data) => {
        syncSessionHint(data);
        setSession(data);
        if (data.user) {
          connectSocket();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: unknown) => {
      const { settings } = payload as {
        settings: {
          appsCompactView: boolean;
          allowSignups: boolean;
          showSystemInfo: boolean;
        };
      };

      setSession((prev) =>
        prev?.user
          ? {
              ...prev,
              settings: {
                appsCompactView: settings.appsCompactView,
                allowSignups: settings.allowSignups,
                showSystemInfo: settings.showSystemInfo,
              },
            }
          : prev,
      );
    };

    socket.on("settings:updated", handler);
    return () => {
      socket.off("settings:updated", handler);
    };
  }, [session?.user]);

  const logout = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
      clearUserCache(userId);
    }
    disconnectSocket();
    clearSessionHint();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setSession({ user: null });
  }, [session?.user?.id]);

  const userId = session?.user?.id ?? null;

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession, logout }}>
      <CacheProvider userId={userId}>{children}</CacheProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useSession() {
  const { session, loading, refreshSession } = useAuth();
  return {
    user: session?.user ?? null,
    settings: session?.settings,
    loading,
    refreshSession,
  };
}
