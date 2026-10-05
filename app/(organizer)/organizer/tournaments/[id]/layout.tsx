import Link from "next/link";
import { notFound } from "next/navigation";
import { TournamentTabs } from "@/components/tournament-tabs";
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
  const { supabase } = await requireOrganizer();
  const { id } = await params;
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

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
        <h1 className="page-title">{tournament.name}</h1>
        <div className="mt-4">
          <TournamentTabs tabs={tabs(id)} />
        </div>
      </div>
      {children}
    </div>
  );
}
