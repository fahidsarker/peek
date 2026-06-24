"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useMemo, useState } from "react";
import {
  shouldPersistQuery,
  storageKey,
} from "@/lib/queries/persist";

export function QueryProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 24 * 60 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  const persistOptions = useMemo(() => {
    if (!userId) {
      return null;
    }

    return {
      persister: createAsyncStoragePersister({
        storage: window.localStorage,
        key: storageKey(userId),
      }),
      dehydrateOptions: {
        shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
          shouldPersistQuery(query.queryKey),
      },
    };
  }, [userId]);

  if (!persistOptions) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
