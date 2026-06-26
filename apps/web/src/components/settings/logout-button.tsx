import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    setPending(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-console text-sm text-muted">Account</h2>
      {error && <p className="font-console text-xs text-muted">{error}</p>}
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
