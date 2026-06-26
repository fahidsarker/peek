import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CacheEntry } from "./store";
import { readCache, writeCache as persistCache } from "./store";

type Listener = () => void;

type MemoryEntry = {
  data: unknown;
  updatedAt: number;
};

type CacheContextValue = {
  userId: string | null;
  getEntry: <T>(key: string) => MemoryEntry | null;
  setEntry: <T>(key: string, data: T) => CacheEntry<T>;
  subscribe: (key: string, listener: Listener) => () => void;
};

const CacheContext = createContext<CacheContextValue | null>(null);

export function CacheProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const memoryRef = useRef(new Map<string, MemoryEntry>());
  const listenersRef = useRef(new Map<string, Set<Listener>>());

  const notify = useCallback((key: string) => {
    listenersRef.current.get(key)?.forEach((l) => l());
  }, []);

  const getEntry = useCallback(
    <T,>(key: string): MemoryEntry | null => {
      const mem = memoryRef.current.get(key);
      if (mem) return mem;

      if (!userId) return null;
      const cached = readCache<T>(userId, key);
      if (!cached) return null;

      const entry: MemoryEntry = {
        data: cached.data,
        updatedAt: cached.updatedAt,
      };
      memoryRef.current.set(key, entry);
      return entry;
    },
    [userId],
  );

  const setEntry = useCallback(
    <T,>(key: string, data: T): CacheEntry<T> => {
      const entry: MemoryEntry = { data, updatedAt: Date.now() };
      memoryRef.current.set(key, entry);

      if (userId) {
        persistCache(userId, key, data);
      }

      notify(key);
      return { data, updatedAt: entry.updatedAt };
    },
    [userId, notify],
  );

  const subscribe = useCallback((key: string, listener: Listener) => {
    if (!listenersRef.current.has(key)) {
      listenersRef.current.set(key, new Set());
    }
    listenersRef.current.get(key)!.add(listener);
    return () => {
      listenersRef.current.get(key)?.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ userId, getEntry, setEntry, subscribe }),
    [userId, getEntry, setEntry, subscribe],
  );

  return (
    <CacheContext.Provider value={value}>{children}</CacheContext.Provider>
  );
}

export function useCacheContext() {
  const ctx = useContext(CacheContext);
  if (!ctx) {
    throw new Error("useCacheContext must be used within CacheProvider");
  }
  return ctx;
}

export function useCacheEntry<T>(key: string) {
  const { getEntry, subscribe } = useCacheContext();

  return useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    () => getEntry<T>(key),
    () => getEntry<T>(key),
  );
}
