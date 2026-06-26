import { Link } from "react-router-dom";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LogoutButton } from "@/components/settings/logout-button";
import { useSession } from "@/lib/auth-context";

export function SettingsPage() {
  const { user } = useSession();

  if (!user) return null;

  return (
    <main className="mx-auto min-h-full w-full max-w-4xl flex-1 p-6 md:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-console text-sm text-muted">peek</p>
          <h1 className="font-greeting text-2xl">Settings</h1>
        </div>
        <Link
          to="/"
          className="font-console text-sm text-muted underline transition-opacity hover:opacity-80"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-12">
        {user.isAdmin && <AdminPanel currentUserId={user.id} />}
        <LogoutButton />
      </div>
    </main>
  );
}
