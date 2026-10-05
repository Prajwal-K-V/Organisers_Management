"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStartNavigation } from "@/components/pending-provider";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const startNavigation = useStartNavigation();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={() => {
        startNavigation();
        onNavigate?.();
      }}
      className={cn(
        "rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-[var(--primary)] text-white shadow-md shadow-blue-600/15"
          : "text-slate-600 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-foreground)]"
      )}
    >
      {label}
    </Link>
  );
}
