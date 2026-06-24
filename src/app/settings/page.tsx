import Link from "next/link";
import { getAdminData } from "@/app/admin/actions";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LogoutButton } from "@/components/settings/logout-button";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const user = session!.user;
  const isAdmin = user.isAdmin;
  const adminData = isAdmin ? await getAdminData() : null;

  return (
    <main className="mx-auto min-h-full w-full max-w-4xl flex-1 p-6 md:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-console text-sm text-muted">peek</p>
          <h1 className="font-greeting text-2xl">Settings</h1>
        </div>
        <Link
          href="/"
          className="font-console text-sm text-muted underline transition-opacity hover:opacity-80"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-12">
        {isAdmin && adminData && (
          <AdminPanel
            apps={adminData.apps}
            users={adminData.users}
            settings={adminData.settings}
            currentUserId={user.id}
          />
        )}
        <LogoutButton userId={user.id} />
      </div>
    </main>
  );
}
