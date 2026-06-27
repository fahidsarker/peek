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

export function DashboardSkeleton({ hint }: { hint: SessionHint }) {
  const firstName = hint.name.split(" ")[0];
  const greetingWidth =
    firstName.length <= 4 ? "w-36" : firstName.length <= 8 ? "w-44" : "w-52";

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden p-6 md:p-10">
      <div className="mb-4 flex shrink-0 items-start justify-between">
        <div>
          <Skeleton className={`h-9 ${greetingWidth}`} />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-4 h-9 w-40 rounded-lg" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-0 rounded-2xl border-border ${
          hint.showDocker ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        <section className="flex min-h-0 flex-col p-6 md:p-8">
          <Skeleton className="mb-6 h-28 w-full rounded-lg" />
          <div className="mb-6 flex shrink-0 items-center gap-2">
            <span className="font-console text-sm text-muted">Apps</span>
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <AppRowSkeleton key={i} />
            ))}
          </div>
        </section>

        {hint.showDocker && (
          <section className="flex min-h-0 flex-col border-t border-border p-6 md:border-t-0 md:border-l md:border-dashed md:p-8">
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <span className="font-console text-sm text-muted">Docker</span>
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <div className="divide-y divide-border">
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
