"use client";

import { QueryProvider } from "@/components/query-provider";
import { authClient } from "@/lib/auth-client";

export function SessionQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();

  return (
    <QueryProvider userId={session?.user?.id ?? null}>
      {children}
    </QueryProvider>
  );
}
