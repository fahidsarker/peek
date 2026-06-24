import Link from "next/link";
import { AdminPanel } from "@/components/admin/admin-panel";
import { getAdminData } from "@/app/admin/actions";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  const data = await getAdminData();

  return (
    <main className="mx-auto min-h-full w-full max-w-4xl flex-1 p-6 md:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-console text-sm text-muted">Admin</p>
          <h1 className="font-greeting text-2xl">Settings</h1>
        </div>
        <Link
          href="/"
          className="font-console text-sm text-muted underline transition-opacity hover:opacity-80"
        >
          Back to dashboard
        </Link>
      </div>

      <AdminPanel
        apps={data.apps}
        users={data.users}
        settings={data.settings}
        currentUserId={session!.user.id}
      />
    </main>
  );
}
