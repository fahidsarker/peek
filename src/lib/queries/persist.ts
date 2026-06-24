const PERSIST_PREFIX = "peek";

export function storageKey(uid: string) {
  return `${PERSIST_PREFIX}:${uid}:query-cache`;
}

export function clearPersistedQueries(uid: string) {
  const prefix = `${PERSIST_PREFIX}:${uid}:`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}

const PERSISTED_QUERY_ROOTS = new Set(["weather", "apps", "docker"]);

export function shouldPersistQuery(queryKey: readonly unknown[]) {
  return typeof queryKey[0] === "string" && PERSISTED_QUERY_ROOTS.has(queryKey[0]);
}
