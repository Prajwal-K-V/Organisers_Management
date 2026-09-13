import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ListToolbar({
  title,
  count,
  addLabel,
  onAdd,
  extra,
}: {
  title: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-[var(--muted)]">{count === 1 ? "1 item" : `${count} items`}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {extra}
        <Button type="button" className="w-full sm:w-auto" onClick={onAdd}>
          + {addLabel}
        </Button>
      </div>
    </div>
  );
}
