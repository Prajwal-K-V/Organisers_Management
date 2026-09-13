import { PlayersManager } from "@/components/players-manager";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOrganizer();
  const { id: tournamentId } = await params;
  const supabase = createClient(await cookies());
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("player_code");

  return <PlayersManager tournamentId={tournamentId} players={players ?? []} />;
}
