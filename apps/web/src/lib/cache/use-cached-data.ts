import { useEffect, useRef, useState, useCallback } from "react";
import { useCacheContext } from "./cache-context";
import type { DataStatus } from "./store";
import { getSocket } from "../socket";

type UseCachedDataOptions<T> = {
  key: string;
  fetcher?: () => Promise<T>;
  socketEvent?: string;
  socketParser?: (payload: unknown) => T;
  enabled?: boolean;
};

export function useCachedData<T>({
  key,
  fetcher,
  socketEvent,
  socketParser,
  enabled = true,
}: UseCachedDataOptions<T>) {
  const { getEntry, setEntry, subscribe } = useCacheContext();
  const [status, setStatus] = useState<DataStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [, bump] = useState(0);
  const fetchingRef = useRef(false);

  const entry = getEntry<T>(key);

  useEffect(() => {
    return subscribe(key, () => bump((n) => n + 1));
  }, [key, subscribe]);

  const applyData = useCallback(
    (data: T) => {
      setEntry(key, data);
      setStatus("fresh");
      setError(null);
    },
    [key, setEntry],
  );

  const refresh = useCallback(async () => {
    if (!fetcher || !enabled) return;

    const existing = getEntry<T>(key);
    if (existing) {
      setStatus("stale");
    } else {
      setStatus("loading");
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const data = await fetcher();
      applyData(data);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to fetch");
      if (existing) {
        setStatus("stale");
        setError(e);
      } else {
        setStatus("error");
        setError(e);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [fetcher, enabled, key, getEntry, applyData]);

  useEffect(() => {
    if (!enabled) return;

    const existing = getEntry<T>(key);
    if (existing) {
      setStatus("stale");
    } else {
      setStatus("loading");
    }

    refresh();
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socketEvent || !enabled) return;

    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: unknown) => {
      const data = socketParser
        ? socketParser(payload)
        : (payload as T);
      applyData(data);
    };

    socket.on(socketEvent, handler);
    return () => {
      socket.off(socketEvent, handler);
    };
  }, [socketEvent, enabled, socketParser, applyData]);

  return {
    data: entry?.data as T | undefined,
    status,
    error,
    refresh,
  };
}
