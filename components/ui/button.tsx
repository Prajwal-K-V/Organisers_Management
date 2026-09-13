import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)]",
    secondary:
      "border-2 border-[var(--border-subtle)] bg-white text-[var(--accent-foreground)] hover:bg-[var(--accent-soft)]",
    danger: "bg-[var(--danger)] text-white hover:bg-[#b91c1c]",
    ghost: "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
