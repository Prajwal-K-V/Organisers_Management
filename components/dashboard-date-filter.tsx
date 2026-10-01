"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  from?: string;
  to?: string;
};

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function DashboardDateFilter({ from, to }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hasActiveFilter = Boolean(from || to);

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {hasActiveFilter && !open ? (
          <span className="text-xs font-medium text-[var(--muted)]">
            {from && to ? `${from} → ${to}` : from ? `From ${from}` : `Until ${to}`}
          </span>
        ) : null}
        <Button
          type="button"
          variant={open || hasActiveFilter ? "secondary" : "ghost"}
          className="gap-2"
          aria-expanded={open}
          aria-controls="dashboard-date-filter-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <FilterIcon className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Filter</span>
          {hasActiveFilter ? (
            <span className="flex h-2 w-2 rounded-full bg-[var(--primary)]" aria-label="Filter active" />
          ) : null}
        </Button>
      </div>

      <div
        id="dashboard-date-filter-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <form
            className="mt-3 flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const params = new URLSearchParams();
              const fromVal = String(fd.get("from") ?? "");
              const toVal = String(fd.get("to") ?? "");
              if (fromVal) params.set("from", fromVal);
              if (toVal) params.set("to", toVal);
              const q = params.toString();
              router.push(q ? `/organizer/dashboard?${q}` : "/organizer/dashboard");
              setOpen(false);
            }}
          >
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              From
              <input
                type="date"
                name="from"
                defaultValue={from ?? ""}
                className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--foreground)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              To
              <input
                type="date"
                name="to"
                defaultValue={to ?? ""}
                className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--foreground)]"
              />
            </label>
            <Button type="submit" variant="secondary" className="sm:mb-0">
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                router.push("/organizer/dashboard");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
