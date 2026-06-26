export type DataStatus = "loading" | "stale" | "fresh" | "error";

export type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const PREFIX = "peek";

export function cacheStorageKey(userId: string, key: string) {
  return `${PREFIX}:${userId}:${key}`;
}

export function readCache<T>(userId: string, key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(cacheStorageKey(userId, key));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export function writeCache<T>(userId: string, key: string, data: T): CacheEntry<T> {
  const entry: CacheEntry<T> = { data, updatedAt: Date.now() };
  localStorage.setItem(cacheStorageKey(userId, key), JSON.stringify(entry));
  return entry;
}

export function clearUserCache(userId: string) {
  const prefix = `${PREFIX}:${userId}:`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const storageKey = localStorage.key(i);
    if (storageKey?.startsWith(prefix)) {
      localStorage.removeItem(storageKey);
    }
  }
}
