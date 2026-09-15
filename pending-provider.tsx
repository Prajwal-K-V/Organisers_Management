"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/spinner";

type PendingContextValue = {
  startNavigation: () => void;
};

const PendingContext = createContext<PendingContextValue | null>(null);

export function useStartNavigation() {
  const ctx = useContext(PendingContext);
  return ctx?.startNavigation ?? (() => {});
}

export function PendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navPending, setNavPending] = useState(false);
  const [formPending, setFormPending] = useState(false);

  const startNavigation = useCallback(() => setNavPending(true), []);

  useEffect(() => {
    setNavPending(false);
    setFormPending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onSubmit = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLFormElement) setFormPending(true);
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  const busy = navPending || formPending;

  return (
    <PendingContext.Provider value={{ startNavigation }}>
      {busy ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-[var(--accent-soft)]"
          role="progressbar"
          aria-label="Loading"
        >
          <div className="h-full w-1/3 animate-[pending-bar_1s_ease-in-out_infinite] bg-[var(--primary)]" />
        </div>
      ) : null}
      {formPending ? (
        <div
          className="pointer-events-none fixed inset-0 z-[150] flex items-end justify-center pb-24 sm:items-center sm:pb-0"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-xl border-2 border-[var(--border-subtle)] bg-white px-4 py-3 shadow-lg">
            <Spinner className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Working…</span>
          </div>
        </div>
      ) : null}
      {children}
    </PendingContext.Provider>
  );
}
