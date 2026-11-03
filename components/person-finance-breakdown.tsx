"use client";

import { Card } from "@/components/ui/card";
import { formatCredits } from "@/lib/dashboard-finance";

export type PersonFinanceRow = {
  name: string;
  cashIn: number;
  phonePeIn: number;
  totalIn: number;
  paidOut: number;
};

function Amt({ value, style }: { value: number; style?: React.CSSProperties }) {
  if (!value) return <span className="text-[var(--muted)]">—</span>;
  return <span style={style}>{formatCredits(value)}</span>;
}

export function PersonFinanceBreakdown({ rows }: { rows: PersonFinanceRow[] }) {
  if (!rows.length) return null;

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
        Received By — Breakdown
      </p>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left pb-2 font-medium text-[var(--muted)] pr-4">Person</th>
              <th className="text-right pb-2 font-medium text-[var(--muted)] pr-4">Cash In</th>
              <th className="text-right pb-2 font-medium text-[var(--muted)] pr-4">PhonePe In</th>
              <th className="text-right pb-2 font-medium text-[var(--muted)] pr-4">Total In</th>
              <th className="text-right pb-2 font-medium text-[var(--muted)]">Paid Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-4 font-medium">{row.name}</td>
                <td className="py-2 pr-4 text-right">
                  <Amt value={row.cashIn} style={{ color: "var(--success-text)" }} />
                </td>
                <td className="py-2 pr-4 text-right">
                  <Amt value={row.phonePeIn} style={{ color: "var(--success-text)" }} />
                </td>
                <td className="py-2 pr-4 text-right font-semibold">
                  <Amt value={row.totalIn} style={{ color: "var(--success-text)" }} />
                </td>
                <td className="py-2 text-right">
                  <Amt value={row.paidOut} style={{ color: "var(--danger)" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
