import { TeamsManager } from "@/components/teams-manager";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId } = await params;
  const [{ data: teams }, { data: players }] = await Promise.all([
    supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name"),
    supabase.from("players").select("team_id, sold_price").eq("tournament_id", tournamentId),
  ]);

  return <TeamsManager tournamentId={tournamentId} teams={teams ?? []} players={players ?? []} />;
}
