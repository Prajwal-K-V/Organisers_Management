"use client";

import { type FormHTMLAttributes, type ReactNode } from "react";
import { SubmitButton } from "@/components/submit-button";

export function ConfirmSubmit({
  message,
  children,
  ...formProps
}: FormHTMLAttributes<HTMLFormElement> & {
  message: string;
  children: ReactNode;
}) {
  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        if (!confirm(message)) {
          e.preventDefault();
          return;
        }
        formProps.onSubmit?.(e);
      }}
    >
      {children}
    </form>
  );
}

export function ConfirmDeleteButton({ label = "Delete", className }: { label?: string; className?: string }) {
  return <SubmitButton variant="danger" className={className}>{label}</SubmitButton>;
}
