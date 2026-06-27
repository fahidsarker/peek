import { Skeleton } from "@/components/skeleton";

export function SettingsSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-4xl flex-1 p-6 md:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </main>
  );
}
