import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--card)] p-4 sm:p-6",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}
