"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Signup failed");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Login failed");
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="font-console text-lg">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>

        {mode === "signup" && (
          <label className="block space-y-1">
            <span className="font-console text-xs text-muted">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-muted"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="font-console text-xs text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-muted"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-console text-xs text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-muted"
          />
        </label>

        {error && (
          <p className="font-console text-xs text-status-down">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg border border-border px-4 py-2 font-console text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>
    </FadeIn>
  );
}
