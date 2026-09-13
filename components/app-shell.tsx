"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FlashBannerSlot } from "@/components/flash-banner-slot";
import { NavLink } from "@/components/nav-link";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden>
      <span className={cn("absolute left-0 block h-0.5 w-5 bg-current transition", open ? "top-2 rotate-45" : "top-0.5")} />
      <span className={cn("absolute left-0 top-2 block h-0.5 w-5 bg-current transition", open ? "opacity-0" : "opacity-100")} />
      <span className={cn("absolute left-0 block h-0.5 w-5 bg-current transition", open ? "top-2 -rotate-45" : "top-3.5")} />
    </span>
  );
}

function SidebarPanel({
  title,
  subtitle,
  nav,
  signOutAction,
  onNavigate,
  className,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  signOutAction?: () => Promise<void>;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("flex h-full w-[min(100vw-3rem,17rem)] flex-col border-r-2 border-[var(--sidebar-border)] bg-[var(--sidebar)] md:w-64", className)}>
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-br from-[var(--primary)] via-[#dc2626] to-[var(--accent)] px-5 py-5 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">OM</span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">{title}</p>
            {subtitle && <p className="truncate text-xs text-amber-100">{subtitle}</p>}
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {nav.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} onNavigate={onNavigate} />
        ))}
      </nav>
      {signOutAction && (
        <form action={signOutAction} className="border-t border-[var(--border-subtle)] p-4">
          <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone-500 transition hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]">
            Sign out
          </button>
        </form>
      )}
    </aside>
  );
}

function titleFromPath(pathname: string, nav: NavItem[]): string {
  const exact = nav.find((n) => n.href === pathname);
  if (exact) return exact.label;
  const nested = nav.find((n) => n.href !== "/" && pathname.startsWith(n.href + "/"));
  if (nested) return nested.label;
  if (pathname.includes("/auction")) return "Auction";
  if (pathname.includes("/finance")) return "Finance";
  if (pathname.includes("/admin/tournaments")) return "Tournaments";
  if (pathname.includes("/team-view")) return "Team view";
  if (pathname.includes("/teams")) return "Teams";
  if (pathname.includes("/players")) return "Players";
  if (pathname.includes("/tournaments/")) return "Tournament";
  return "Menu";
}

export function AppShell({
  title,
  subtitle,
  nav,
  children,
  signOutAction,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
  signOutAction?: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const screenTitle = useMemo(() => titleFromPath(pathname, nav), [pathname, nav]);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b-2 border-[var(--border-subtle)] bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:hidden">
        <button
          type="button"
          className="rounded-lg p-2.5 text-[var(--primary)] hover:bg-[var(--accent-soft)]"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[var(--foreground)]">{screenTitle}</p>
          <p className="truncate text-xs text-[var(--muted)]">{title}</p>
        </div>
      </header>

      {menuOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-stone-900/50 md:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      )}

      <div className="flex min-h-[calc(100dvh-3.25rem)] md:min-h-[100dvh]">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 md:pt-0",
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <SidebarPanel
            title={title}
            subtitle={subtitle}
            nav={nav}
            signOutAction={signOutAction}
            onNavigate={() => setMenuOpen(false)}
            className="h-full min-h-[100dvh] shadow-2xl md:min-h-0 md:shadow-none"
          />
        </div>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 md:p-10">
          <div className="mx-auto w-full max-w-6xl">
            <FlashBannerSlot />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
