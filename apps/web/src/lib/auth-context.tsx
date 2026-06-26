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
import { connectSocket, disconnectSocket } from "./socket";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const data = await fetchSession();
    setSession(data);
    return;
  }, []);

  useEffect(() => {
    fetchSession()
      .then((data) => {
        setSession(data);
        if (data.user) {
          connectSocket();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
      clearUserCache(userId);
    }
    disconnectSocket();
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
