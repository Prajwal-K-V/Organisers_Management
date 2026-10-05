"use client";

import { useMemo, useState } from "react";
import { assignPlayerSale } from "@/app/actions/auction";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type AuctionPoolPlayer = {
  id: string;
  name: string;
  player_code: string | null;
  base_price: number;
  role: string | null;
};

export type AuctionTeamOption = {
  id: string;
  name: string;
  purseRemaining: number;
};

function playerSearchText(p: AuctionPoolPlayer) {
  return `${p.name} ${p.player_code ?? ""} ${p.role ?? ""}`.toLowerCase();
}

export function AuctionSalePanel({
  tournamentId,
  players,
  teams,
}: {
  tournamentId: string;
  players: AuctionPoolPlayer[];
  teams: AuctionTeamOption[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(players[0]?.id ?? null);
  const [amount, setAmount] = useState(() =>
    players[0] != null ? String(players[0].base_price) : ""
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => playerSearchText(p).includes(q));
  }, [players, query]);

  const selected = players.find((p) => p.id === selectedId) ?? null;

  const selectPlayer = (id: string) => {
    setSelectedId(id);
    const p = players.find((x) => x.id === id);
    if (p) setAmount(String(p.base_price));
  };

  const action = assignPlayerSale.bind(null, tournamentId);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="auction-player-search">
          Search player
        </label>
        <Input
          id="auction-player-search"
          type="search"
          placeholder="Name or code (e.g. P012, Sharma)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-[var(--muted)]">
          {filtered.length === players.length
            ? `${players.length} available`
            : `${filtered.length} of ${players.length} match`}
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Player</span>
        <input type="hidden" name="player_id" value={selectedId ?? ""} required />
        {selected && !filtered.some((p) => p.id === selectedId) ? (
          <p className="rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm">
            Selected: <span className="font-semibold">{selected.name}</span> — clear search to see in list
          </p>
        ) : null}
        <ul
          className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border-2 border-[var(--border-subtle)] bg-stone-50/50 p-2 [scrollbar-width:thin]"
          role="listbox"
          aria-label="Players in pool"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-[var(--muted)]">No players match your search.</li>
          ) : (
            filtered.map((p) => {
              const active = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectPlayer(p.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "bg-white shadow-sm ring-2 ring-[var(--primary)]"
                        : "bg-white/80 hover:bg-white hover:shadow-sm"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-stone-900">
                        {p.player_code ? (
                          <span className="text-[var(--muted)]">{p.player_code} · </span>
                        ) : null}
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)] capitalize">
                        {(p.role ?? "player").replace(/_/g, " ")} · Base {p.base_price}
                      </span>
                    </span>
                    {active ? (
                      <span className="shrink-0 text-xs font-semibold text-[var(--primary)]">Selected</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <FieldGroup className="items-stretch">
        <Field
          label="Bid points"
          name="amount"
          type="number"
          min={selected?.base_price ?? 0}
          step={1}
          required
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hint={selected ? `Minimum ${selected.base_price} for ${selected.name}` : undefined}
        />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Team</span>
          <Select name="team_id" required defaultValue="">
            <option value="" disabled>Select team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.purseRemaining} left)
              </option>
            ))}
          </Select>
        </label>
      </FieldGroup>

      <SubmitButton className="w-full" pendingLabel="Recording sale…" disabled={!selectedId}>
        Confirm sale
      </SubmitButton>
    </form>
  );
}
