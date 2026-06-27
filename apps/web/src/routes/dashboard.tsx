import { Link } from "react-router-dom";
import { AppList, AppListHeader } from "@/components/app-list";
import { DashboardSearch } from "@/components/dashboard-search";
import { Clock } from "@/components/clock";
import { DockerList, DockerListHeader } from "@/components/docker-list";
import { FadeIn } from "@/components/fade-in";
import { SystemInfo } from "@/components/system-info";
import { WeatherWidget } from "@/components/weather-widget";
import { useSession } from "@/lib/auth-context";

export function DashboardPage() {
  const { user, settings } = useSession();
  const showDocker = user?.showDocker ?? false;
  const appsCompactView = settings?.appsCompactView ?? true;

  if (!user) return null;

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden p-6 md:p-10">
      <div className="mb-4 flex shrink-0 items-start justify-between">
        <FadeIn>
          <p className="font-greeting text-3xl">
            Hello {user.name.split(" ")[0]}
          </p>
          <Clock />
          <WeatherWidget />
        </FadeIn>

        <div className="flex items-center gap-2">
          <DashboardSearch showDocker={!!showDocker} />
          <Link
            to="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border font-console text-sm text-muted transition-opacity hover:opacity-80"
            title="Settings"
          >
            ⚙
          </Link>
        </div>
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-0 rounded-2xl border-border ${
          showDocker ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        <section className="flex min-h-0 flex-col p-6 md:p-8">
          <SystemInfo />
          <div className="mb-6 flex shrink-0 items-center gap-2">
            <h2 className="font-console text-sm text-muted">Apps</h2>
            <AppListHeader />
          </div>
          <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
            <AppList compact={appsCompactView} />
          </div>
        </section>

        {showDocker && (
          <section className="flex min-h-0 flex-col border-t border-border p-6 md:border-t-0 md:border-l md:border-dashed md:p-8">
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <h2 className="font-console text-sm text-muted">Docker</h2>
              <DockerListHeader />
            </div>
            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
              <DockerList />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
