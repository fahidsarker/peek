import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";

export function LoginPage() {
  const [signupsAllowed, setSignupsAllowed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/signups-allowed", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSignupsAllowed(data.allowed))
      .catch(() => {});
  }, []);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <p className="font-greeting text-2xl">peek</p>
        <AuthForm mode="login" />
        {signupsAllowed && (
          <p className="font-console text-xs text-muted">
            No account?{" "}
            <Link to="/signup" className="text-foreground underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export function SignupPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/signups-allowed", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAllowed(data.allowed))
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-console text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <p className="font-greeting text-2xl">peek</p>
        <AuthForm mode="signup" />
        <p className="font-console text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
