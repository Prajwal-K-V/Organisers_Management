import { type ReactNode } from "react";

/** Horizontal scroll wrapper for wide tables on small screens. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap -mx-1 px-1 sm:mx-0 sm:px-0">
      {children}
    </div>
  );
}
