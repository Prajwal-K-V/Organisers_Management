import Link from "next/link";
import { notFound } from "next/navigation";
import { TournamentTabs } from "@/components/tournament-tabs";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

const tabs = (id: string) => [
  { href: `/organizer/tournaments/${id}`, label: "Overview" },
  { href: `/organizer/tournaments/${id}/teams`, label: "Teams" },
  { href: `/organizer/tournaments/${id}/team-view`, label: "Team view" },
  { href: `/organizer/tournaments/${id}/players`, label: "Players" },
  { href: `/organizer/tournaments/${id}/auction`, label: "Auction" },
  { href: `/organizer/tournaments/${id}/finance`, label: "Finance" },
];

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireOrganizer();
  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", id)
    .eq("organizer_id", profile.id)
    .single();

  if (!tournament) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/organizer/tournaments"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
      >
        ← All tournaments
      </Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">Tournament</p>
        <h1 className="page-title mt-1">{tournament.name}</h1>
        <div className="mt-5">
          <TournamentTabs tabs={tabs(id)} />
        </div>
      </div>
      {children}
    </div>
  );
}
