import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/lib/auth-context";

export function ProtectedRoute() {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-console text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-console text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
