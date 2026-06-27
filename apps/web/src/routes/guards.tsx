import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoadingFallback } from "@/components/auth-loading-fallback";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { SettingsSkeleton } from "@/components/settings-skeleton";
import { useSession } from "@/lib/auth-context";
import { readSessionHint } from "@/lib/session-hint";

export function ProtectedRoute() {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    const hint = readSessionHint();
    if (hint) {
      return location.pathname.startsWith("/settings") ? (
        <SettingsSkeleton />
      ) : (
        <DashboardSkeleton hint={hint} />
      );
    }
    return <AuthLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useSession();

  if (loading) {
    const hint = readSessionHint();
    if (hint) return <DashboardSkeleton hint={hint} />;
    return <AuthLoadingFallback />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
