"use client";

import { Suspense, type ReactNode } from "react";
import { PendingProvider } from "@/components/pending-provider";

export function PendingShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PendingProvider>{children}</PendingProvider>
    </Suspense>
  );
}
