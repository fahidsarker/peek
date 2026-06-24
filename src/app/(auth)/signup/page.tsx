import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { isSignupsAllowed } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const allowed = await isSignupsAllowed();
  if (!allowed) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <p className="font-greeting text-2xl">peek</p>
        <AuthForm mode="signup" />
        <p className="font-console text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
