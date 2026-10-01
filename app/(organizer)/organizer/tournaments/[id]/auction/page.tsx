import Link from "next/link";
import { assignPlayerSale } from "@/app/actions/auction";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { notFound } from "next/navigation";
import { teamPurseRemaining } from "@/lib/team-roster";
import { fetchOrganizerPlayerRosterBits, fetchOrganizerPlayers, fetchOrganizerTeams } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId } = await params;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) notFound();

  const [teams, allPlayers, pursePlayers] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    fetchOrganizerPlayers(supabase, tournamentId),
    fetchOrganizerPlayerRosterBits(supabase, tournamentId),
  ]);
  const players = allPlayers.filter((p) => p.status === "available" || p.status === "unsold");

  if (!teams.length || !players.length) {
    return (
      <Card>
        <EmptyState
          title="Auction not ready"
          description="Add at least one team and one available player first."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href={`/organizer/tournaments/${tournamentId}/teams`}>
                <Button variant="secondary">Add teams</Button>
              </Link>
              <Link href={`/organizer/tournaments/${tournamentId}/players`}>
                <Button variant="secondary">Add players</Button>
              </Link>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <div>
        <h2 className="font-semibold">Auction</h2>
        <p className="text-sm text-[var(--muted)]">Pick a player, enter points, choose the buying team, then confirm.</p>
      </div>

      <form action={assignPlayerSale.bind(null, tournamentId)}>
        <FieldGroup className="items-stretch">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Player</span>
            <select
              name="player_id"
              required
              className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>Select player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.player_code ? `${p.player_code} · ` : ""}
                  {p.name} (base {p.base_price})
                </option>
              ))}
            </select>
          </label>

          <Field label="Bid points" name="amount" type="number" min={0} step={1} required placeholder="Amount" />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Team</span>
            <select
              name="team_id"
              required
              className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>Select team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({teamPurseRemaining(t.purse_total, pursePlayers ?? [], t.id)} left)
                </option>
              ))}
            </select>
          </label>
        </FieldGroup>

        <SubmitButton className="mt-6 w-full" pendingLabel="Saving…">
          Done
        </SubmitButton>
      </form>
    </Card>
  );
}
