import { type InputHTMLAttributes, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  className,
  inputClassName,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  inputClassName?: string;
}) {
  const id = inputProps.id ?? inputProps.name;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <Input id={id} className={inputClassName} {...inputProps} />
      {hint && <span className="block text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
