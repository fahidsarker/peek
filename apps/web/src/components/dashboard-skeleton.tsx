import { Skeleton } from "@/components/skeleton";
import type { SessionHint } from "@/lib/session-hint";

function AppRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function SectionHeaderSkeleton({
  title,
  showChevron,
}: {
  title: string;
  showChevron: boolean;
}) {
  return (
    <div className="mb-6 flex shrink-0 items-center gap-2">
      {showChevron && (
        <span className="font-console text-sm text-muted md:hidden">▾</span>
      )}
      <span className="font-console text-sm text-muted">{title}</span>
      <Skeleton className="h-3 w-3 rounded-full" />
    </div>
  );
}

export function DashboardSkeleton({ hint }: { hint: SessionHint }) {
  const firstName = hint.name.split(" ")[0];
  const greetingWidth =
    firstName.length <= 4 ? "w-36" : firstName.length <= 8 ? "w-44" : "w-52";

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden p-6 md:p-10">
      <div className="mb-4 flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className={`h-8 md:h-9 ${greetingWidth}`} />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-4 h-9 w-40 rounded-lg" />
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <Skeleton className="h-10 flex-1 rounded-full md:flex-none md:w-36" />
          <Skeleton className="h-10 flex-1 rounded-full md:flex-none md:w-10" />
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-0 rounded-2xl border-border md:grid ${
          hint.showDocker ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        <section className="flex min-h-0 flex-1 flex-col p-6 md:p-8">
          <SectionHeaderSkeleton
            title="Apps"
            showChevron={hint.showDocker}
          />
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <AppRowSkeleton key={i} />
            ))}
          </div>
        </section>

        {hint.showDocker && (
          <section className="flex min-h-0 flex-none flex-col border-t border-border p-6 md:flex-1 md:border-t-0 md:border-l md:border-dashed md:p-8">
            <SectionHeaderSkeleton title="Docker" showChevron />
            <div className="hidden divide-y divide-border md:block">
              {Array.from({ length: 4 }, (_, i) => (
                <AppRowSkeleton key={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
