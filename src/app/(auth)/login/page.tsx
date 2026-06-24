import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isSignupsAllowed } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const signupsAllowed = await isSignupsAllowed();

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <p className="font-greeting text-2xl">peek</p>
        <AuthForm mode="login" />
        {signupsAllowed && (
          <p className="font-console text-xs text-muted">
            No account?{" "}
            <Link href="/signup" className="text-foreground underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
