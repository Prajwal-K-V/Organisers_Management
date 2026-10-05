import Link from "next/link";
import { AuctionSalePanel } from "@/components/auction-sale-panel";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { fetchOrganizerPlayers, fetchOrganizerTeams } from "@/lib/organizer-queries";
import { teamPurseRemaining } from "@/lib/team-roster";
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

  const [teams, allPlayers] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    fetchOrganizerPlayers(supabase, tournamentId),
  ]);

  const rosterBits = allPlayers.map((p) => ({ team_id: p.team_id, sold_price: p.sold_price }));
  const players = allPlayers
    .filter((p) => p.status === "available" || p.status === "unsold")
    .map((p) => ({
      id: p.id,
      name: p.name,
      player_code: p.player_code,
      base_price: Number(p.base_price),
      role: p.role,
    }));

  const teamOptions = teams.map((t) => ({
    id: t.id,
    name: t.name,
    purseRemaining: teamPurseRemaining(t.purse_total, rosterBits, t.id),
  }));

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
        <p className="text-sm text-[var(--muted)]">
          Search for a player, enter points, choose the buying team, then confirm.
        </p>
      </div>

      <AuctionSalePanel tournamentId={tournamentId} players={players} teams={teamOptions} />
    </Card>
  );
}
