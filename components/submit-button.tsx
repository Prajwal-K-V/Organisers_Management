"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={cn(className, "gap-2", pending && "opacity-90")}>
      {pending ? (
        <>
          <Spinner className="size-3.5" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
