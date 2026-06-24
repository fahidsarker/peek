"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { clearPersistedQueries } from "@/lib/queries/persist";

export function LogoutButton({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    setError(null);
    startTransition(async () => {
      clearPersistedQueries(userId);
      queryClient.clear();

      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message ?? "Failed to log out");
        return;
      }

      router.push("/login");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="font-console text-sm text-muted">Account</h2>
      {error && (
        <p className="font-console text-xs text-muted">{error}</p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="rounded-lg border border-border px-4 py-2 font-console text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "Logging out…" : "Log out"}
      </button>
    </section>
  );
}
