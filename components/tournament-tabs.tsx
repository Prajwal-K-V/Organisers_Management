"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStartNavigation } from "@/components/pending-provider";
import { cn } from "@/lib/utils";

export function TournamentTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const startNavigation = useStartNavigation();

  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto border-b border-[var(--border-subtle)] pb-4 px-1 [scrollbar-width:thin]">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => startNavigation()}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                : "border border-[var(--border-subtle)] bg-white text-stone-600 hover:bg-[var(--accent-soft)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
