import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardStatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "income" | "outgoing" | "neutral";
}) {
  const valueClass = {
    default: "text-[var(--primary)]",
    income: "text-[var(--success-text)]",
    outgoing: "text-[var(--danger)]",
    neutral: "text-[var(--foreground)]",
  }[tone];

  return (
    <Card className="space-y-1">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className={cn("stat-value text-2xl sm:text-3xl", valueClass)}>{value}</p>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </Card>
  );
}
