import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm placeholder:text-stone-400",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
        className
      )}
      {...props}
    />
  );
}
