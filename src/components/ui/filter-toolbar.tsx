import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FilterToolbar({
  children,
  summary,
  actions,
  className,
  dataTestId,
}: {
  children: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  className?: string;
  dataTestId?: string;
}) {
  return (
    <section
      data-testid={dataTestId}
      className={cn(
        "rounded-xl border border-border/75 bg-surface/92 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-xs space-y-2.5",
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 min-w-0">{children}</div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
      {summary ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/55 pt-2 text-xs text-muted">
          {summary}
        </div>
      ) : null}
    </section>
  );
}
