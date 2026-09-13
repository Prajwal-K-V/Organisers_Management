"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  from?: string;
  to?: string;
};

export function DashboardDateFilter({ from, to }: Props) {
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
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
        onClick={() => router.push("/organizer/dashboard")}
      >
        Clear
      </Button>
    </form>
  );
}
