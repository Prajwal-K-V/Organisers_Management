"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStartNavigation } from "@/components/pending-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TournamentPick = { id: string; name: string; status: string };

function initials(fullName: string | null, email: string) {
  const source = fullName?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function IconTournament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h12M9 9V5a3 3 0 016 0v4m-9 4v6h12v-6M7 13h10" />
    </svg>
  );
}

function IconTeams({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-3.87M9 20H4v-2a4 4 0 014-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconAuction({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 8m-4-8l2 8M5 6h14l-1 4H6L5 6z" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.5 0-4 1.2-4 3s1.5 3 4 3 4 1.2 4 3-1.5 3-4 3m0-12V6m0 12v2M4 10h16" />
    </svg>
  );
}

const quickItems = [
  { key: "tournament", label: "Tournament", icon: IconTournament, segment: "" },
  { key: "teams", label: "Teams", icon: IconTeams, segment: "/teams" },
  { key: "auction", label: "Auction", icon: IconAuction, segment: "/auction" },
  { key: "finance", label: "Finance", icon: IconFinance, segment: "/finance" },
] as const;

export function DashboardHero({
  profile,
  tournaments,
}: {
  profile: { full_name: string | null; email: string };
  tournaments: TournamentPick[];
}) {
  const startNavigation = useStartNavigation();
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "");

  const selected = useMemo(
    () => tournaments.find((t) => t.id === tournamentId) ?? tournaments[0],
    [tournamentId, tournaments]
  );

  const base = selected ? `/organizer/tournaments/${selected.id}` : null;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-[var(--primary)] via-[#dc2626] to-[var(--accent)] px-4 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold shadow-inner ring-2 ring-white/30"
              aria-hidden
            >
              {initials(profile.full_name, profile.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">Your profile</p>
              <h2 className="mt-0.5 truncate text-xl font-bold sm:text-2xl">
                {profile.full_name?.trim() || "Organizer"}
              </h2>
              <p className="mt-1 truncate text-sm text-amber-50/90">{profile.email}</p>
              <Badge variant="accent" className="mt-2 border-white/30 bg-white/15 text-white">
                Organizer
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Quick access</h3>
            <p className="text-sm text-[var(--muted)]">Jump to tournament tools in one tap.</p>
          </div>
          {tournaments.length > 1 ? (
            <label className="flex w-full flex-col gap-1.5 text-sm sm:max-w-xs">
              <span className="font-medium text-stone-700">Event</span>
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : selected ? (
            <p className="text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">{selected.name}</span>
              <span className="ml-2 capitalize">({selected.status})</span>
            </p>
          ) : null}
        </div>

        {!tournaments.length ? (
          <p className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--accent-soft)]/30 px-4 py-6 text-center text-sm text-[var(--muted)]">
            No tournament assigned yet. Quick links will appear when your admin adds you to an event.{" "}
            <Link href="/organizer/tournaments" className="font-semibold text-[var(--primary)] hover:underline">
              View tournaments
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {quickItems.map(({ key, label, icon: Icon, segment }) => {
              const href = base ? `${base}${segment}` : "/organizer/tournaments";
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => startNavigation()}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[var(--border-subtle)] bg-white px-3 py-4 text-center transition",
                    "hover:border-[var(--primary)] hover:bg-[var(--accent-soft)]/50 hover:shadow-md active:scale-[0.98]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition",
                      key === "finance" && "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
                      key === "tournament" && "bg-amber-50 text-amber-800 group-hover:bg-amber-100",
                      key === "auction" && "bg-red-50 text-[var(--primary)] group-hover:bg-red-100",
                      key === "teams" && "bg-sky-50 text-sky-800 group-hover:bg-sky-100"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
