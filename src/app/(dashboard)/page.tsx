import Link from "next/link";
import { AppList } from "@/components/app-list";
import { Clock } from "@/components/clock";
import { DockerList } from "@/components/docker-list";
import { FadeIn } from "@/components/fade-in";
import { WeatherWidget } from "@/components/weather-widget";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const user = session!.user;
  const showDocker = user.showDocker;

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden p-6 md:p-10">
      <div className="mb-4 flex shrink-0 items-start justify-between">
        <FadeIn>
          <p className="font-greeting text-3xl">Hello {user.name.split(" ")[0]}</p>
          <Clock />
          <WeatherWidget />
        </FadeIn>

        {user.isAdmin && (
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border font-console text-sm text-muted transition-opacity hover:opacity-80"
            title="Settings / Admin"
          >
            ⚙
          </Link>
        )}
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-0 rounded-2xl border-border ${showDocker ? "md:grid-cols-2" : "md:grid-cols-1"
          }`}
      >
        <section className="flex min-h-0 flex-col p-6 md:p-8">
          <h2 className="mb-6 shrink-0 font-console text-sm text-muted">Apps</h2>
          <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
            <AppList />
          </div>
        </section>

        {showDocker && (
          <section className="flex min-h-0 flex-col border-t border-border p-6 md:border-t-0 md:border-l md:border-dashed md:p-8">
            <h2 className="mb-6 shrink-0 font-console text-sm text-muted">Docker</h2>
            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
              <DockerList />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
