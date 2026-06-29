import { useState } from "react";
import { Link } from "react-router-dom";
import { AppList, AppListHeader } from "@/components/app-list";
import { CollapsibleSection } from "@/components/collapsible-section";
import { DashboardSearch } from "@/components/dashboard-search";
import { Clock } from "@/components/clock";
import { DockerContainerDialog } from "@/components/docker-container-dialog";
import { DockerList, DockerListHeader } from "@/components/docker-list";
import { FadeIn } from "@/components/fade-in";
import { WeatherWidget } from "@/components/weather-widget";
import { useSession } from "@/lib/auth-context";
import { useDockerContainers } from "@/lib/hooks/use-docker-containers";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

export function DashboardPage() {
  const { user, settings } = useSession();
  const showDocker = user?.showDocker ?? false;
  const appsCompactView = settings?.appsCompactView ?? true;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeSection, setActiveSection] = useState<"apps" | "docker">("apps");
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(
    null,
  );
  const { refresh: refreshContainers } = useDockerContainers({
    enabled: showDocker,
  });

  if (!user) return null;

  const appsExpanded = !isMobile || !showDocker || activeSection === "apps";
  const dockerExpanded = !isMobile || activeSection === "docker";

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden p-6 md:p-10">
      <div className="mb-4 flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <FadeIn>
          <p className="font-greeting text-2xl md:text-3xl">
            Hello {user.name.split(" ")[0]}
          </p>
          <Clock />
          <WeatherWidget />
        </FadeIn>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <DashboardSearch
            showDocker={!!showDocker}
            onSelectContainer={setSelectedContainerId}
          />
          <Link
            to="/settings"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border font-console text-sm text-muted transition-opacity hover:opacity-80 md:flex-none md:px-4"
            title="Settings"
          >
            <span aria-hidden>⚙</span>
            <span className="md:hidden">Settings</span>
          </Link>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-0 rounded-2xl border-border md:grid ${
          showDocker ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        <CollapsibleSection
          title="Apps"
          headerExtra={<AppListHeader />}
          expanded={appsExpanded}
          collapsible={isMobile && showDocker}
          onToggle={() => setActiveSection("apps")}
        >
          <AppList compact={appsCompactView} />
        </CollapsibleSection>

        {showDocker && (
          <CollapsibleSection
            title="Docker"
            headerExtra={<DockerListHeader />}
            expanded={dockerExpanded}
            collapsible={isMobile}
            onToggle={() => setActiveSection("docker")}
            className="border-t border-border md:border-t-0 md:border-l md:border-dashed"
          >
            <DockerList onSelectContainer={setSelectedContainerId} />
          </CollapsibleSection>
        )}
      </div>

      {showDocker && (
        <DockerContainerDialog
          containerId={selectedContainerId}
          canControl={user.isAdmin ?? false}
          onClose={() => setSelectedContainerId(null)}
          onContainersRefresh={refreshContainers}
        />
      )}
    </main>
  );
}
