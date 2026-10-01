import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const linkBtn =
  "inline-flex h-[42px] w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:w-auto";
const linkPrimary = `${linkBtn} bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)]`;
const linkSecondary = `${linkBtn} border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50`;

type Step = {
  title: string;
  description: string;
  href: string;
  done: boolean;
  cta: string;
};

export function TournamentSetupGuide({
  tournamentId,
  teams,
  players,
}: {
  tournamentId: string;
  teams: number;
  players: number;
}) {
  const base = `/organizer/tournaments/${tournamentId}`;
  const steps: Step[] = [
    {
      title: "Set up teams",
      description: "Create squads and set purse budgets for the auction.",
      href: `${base}/teams`,
      done: teams > 0,
      cta: teams > 0 ? "Manage teams" : "Add teams",
    },
    {
      title: "Register players",
      description: "Add player names, roles, and base prices.",
      href: `${base}/players`,
      done: players > 0,
      cta: players > 0 ? "Manage players" : "Add players",
    },
    {
      title: "Run the auction",
      description: "Open the auction room, place bids, and close lots.",
      href: `${base}/auction`,
      done: false,
      cta: "Open auction",
    },
    {
      title: "Track finances",
      description: "Record income and expenses, and export the ledger.",
      href: `${base}/finance`,
      done: false,
      cta: "Open finance",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <Card className="space-y-5 !p-5 sm:!p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Setup checklist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Work through these steps to get your tournament ready.
          </p>
        </div>
        <p className="text-sm font-medium text-stone-600">
          <span className="font-bold text-stone-900">{completed}</span> of {steps.length} complete
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.href}>
            <div
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                step.done
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-stone-200 bg-white"
              )}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    step.done
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-600"
                  )}
                  aria-hidden
                >
                  {step.done ? "✓" : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{step.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{step.description}</p>
                </div>
              </div>
              <Link
                href={step.href}
                className={cn("shrink-0 sm:ml-4", step.done ? linkSecondary : linkPrimary)}
              >
                {step.cta}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
