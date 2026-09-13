"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export function FlashBanner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const flash = useMemo(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const info = searchParams.get("info");
    if (success) return { type: "success" as const, message: success };
    if (error) return { type: "error" as const, message: error };
    if (info) return { type: "info" as const, message: info };
    return null;
  }, [searchParams]);

  const dismiss = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("success");
    next.delete("error");
    next.delete("info");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!flash) return null;

  return (
    <div
      role="status"
      className={cn(
        "mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm",
        flash.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        flash.type === "error" && "alert-error mb-6 border-red-200",
        flash.type === "info" && "border-amber-200 bg-amber-50 text-amber-950"
      )}
    >
      <p className="leading-relaxed">{flash.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold opacity-70 hover:opacity-100"
        aria-label="Dismiss message"
      >
        ✕
      </button>
    </div>
  );
}
