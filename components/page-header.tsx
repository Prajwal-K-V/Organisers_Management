import { type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
