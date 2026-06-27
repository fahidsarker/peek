import { Skeleton } from "@/components/skeleton";

export function AuthLoadingFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <p className="font-greeting text-2xl text-muted">peek</p>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
