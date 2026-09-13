import { type ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--accent-soft)]/30 px-6 py-12 text-center">
      <p className="text-base font-semibold text-stone-800">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
