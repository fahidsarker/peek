import type { HTMLAttributes } from "react";

export function Skeleton({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`.trim()}
      {...props}
    />
  );
}
