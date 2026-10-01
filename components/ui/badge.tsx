import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "accent" | "success" | "danger" | "muted";
  className?: string;
}) {
  const variants = {
    default: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-foreground)] border-[var(--border-subtle)]",
    success: "bg-[var(--success-bg)] text-[var(--success-text)] border-emerald-200",
    danger: "bg-[var(--error-bg)] text-[var(--danger)] border-red-200",
    muted: "bg-stone-100 text-stone-600 border-stone-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
