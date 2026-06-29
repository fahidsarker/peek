import type { ReactNode } from "react";

export function CollapsibleSection({
  title,
  headerExtra,
  expanded,
  onToggle,
  collapsible = true,
  className = "",
  children,
}: {
  title: string;
  headerExtra?: ReactNode;
  expanded: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const showToggle = collapsible;

  return (
    <section
      className={`flex min-h-0 flex-col p-6 md:flex-1 md:p-8 ${
        expanded ? "flex-1" : "flex-none"
      } ${className}`}
    >
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mb-6 flex w-full shrink-0 items-center gap-2 text-left md:pointer-events-none"
        >
          <span className="font-console text-sm text-muted md:hidden">
            {expanded ? "▾" : "▸"}
          </span>
          <h2 className="font-console text-sm text-muted">{title}</h2>
          {headerExtra}
        </button>
      ) : (
        <div className="mb-6 flex shrink-0 items-center gap-2">
          <h2 className="font-console text-sm text-muted">{title}</h2>
          {headerExtra}
        </div>
      )}

      <div
        className={`scrollbar-hidden min-h-0 flex-1 overflow-y-auto ${
          expanded ? "block" : "hidden md:block"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
