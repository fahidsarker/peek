import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute, GuestRoute } from "@/routes/guards";
import { DashboardPage } from "@/routes/dashboard";
import { LoginPage, SignupPage } from "@/routes/auth";
import { SettingsPage } from "@/routes/settings";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-dvh flex-col">
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/admin" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
