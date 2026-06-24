import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function redirectToLogin() {
  const session = await getSession();
  if (!session?.user) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // stale or invalid token may fail signOut
    }
    redirect("/login");
  }
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!session.user.isAdmin) {
    throw new Error("Forbidden");
  }
  return session;
}
