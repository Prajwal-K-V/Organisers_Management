"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" className="absolute inset-0 bg-stone-900/50" aria-label="Close dialog" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-[min(92dvh,640px)] w-full flex-col overflow-hidden rounded-t-2xl border-2 border-[var(--border-subtle)] bg-white shadow-xl sm:max-w-lg sm:rounded-2xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" className="shrink-0 px-2" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
