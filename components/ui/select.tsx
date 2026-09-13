import { type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)]",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
