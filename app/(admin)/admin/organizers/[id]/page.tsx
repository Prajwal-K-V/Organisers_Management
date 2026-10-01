import { notFound } from "next/navigation";
import Link from "next/link";
import {
  assignOrganizerToTournamentFromProfile,
  resetOrganizerPassword,
  updateOrganizerProfile,
} from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: organizer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "organizer")
    .single();

  if (!organizer) notFound();

  const [{ data: junction }, { data: primaryTournaments }] = await Promise.all([
    supabase.from("tournament_organizers").select("tournament_id").eq("profile_id", id),
    supabase.from("tournaments").select("id, name, status").eq("organizer_id", id),
  ]);

  const tournamentIds = new Set<string>();
  for (const row of junction ?? []) tournamentIds.add(row.tournament_id);
  for (const t of primaryTournaments ?? []) tournamentIds.add(t.id);

  const { data: linkedTournaments } = tournamentIds.size
    ? await supabase
        .from("tournaments")
        .select("id, name, status")
        .in("id", [...tournamentIds])
    : { data: [] as { id: string; name: string; status: string }[] };

  const tournamentMap = new Map<string, { name: string; status: string }>();
  for (const t of linkedTournaments ?? []) {
    tournamentMap.set(t.id, { name: t.name, status: t.status });
  }
  const assignedTournaments = [...tournamentMap.entries()].map(([tid, meta]) => ({
    id: tid,
    ...meta,
  }));

  const { data: allTournaments } = await supabase
    .from("tournaments")
    .select("id, name, status, organizer_id")
    .order("name");

  const assignedIds = new Set(assignedTournaments.map((t) => t.id));
  const assignableTournaments = (allTournaments ?? []).filter((t) => !assignedIds.has(t.id));

  const teamCounts = new Map<string, number>();
  if (assignedTournaments.length) {
    const { data: teamRows } = await supabase
      .from("teams")
      .select("tournament_id")
      .in("tournament_id", assignedTournaments.map((t) => t.id));
    for (const row of teamRows ?? []) {
      teamCounts.set(row.tournament_id, (teamCounts.get(row.tournament_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/organizers" className="text-sm font-medium text-[var(--primary)] hover:underline">
        ← Back to organizers
      </Link>
      <Card className="max-w-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="page-title text-xl">Edit organizer</h1>
          <Badge variant={organizer.is_active ? "success" : "muted"}>
            {organizer.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <form action={updateOrganizerProfile} className="space-y-4">
          <input type="hidden" name="id" value={organizer.id} />
          <Field label="Full name" name="full_name" defaultValue={organizer.full_name ?? ""} />
          <div>
            <p className="text-sm font-medium text-stone-800">Email</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{organizer.email}</p>
          </div>
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </form>
      </Card>

      <Card className="max-w-lg space-y-4">
        <div>
          <h2 className="font-semibold">Reset password</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Set a new login password for this organizer. They will use it on the next sign-in.
          </p>
        </div>
        <form action={resetOrganizerPassword} className="space-y-4">
          <input type="hidden" name="id" value={organizer.id} />
          <Field
            label="New password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <SubmitButton variant="secondary" pendingLabel="Updating…">Update password</SubmitButton>
        </form>
      </Card>

      <Card className="max-w-lg space-y-4">
        <div>
          <h2 className="font-semibold">Tournament access</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Organizers only see teams for tournaments listed here. Creating an account alone does not share another
            organizer&apos;s event.
          </p>
        </div>
        {!assignedTournaments.length ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            No tournaments assigned yet — this is why Teams looks empty. Link them to the tournament that already has
            teams below.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {assignedTournaments.map((t) => {
              const count = teamCounts.get(t.id) ?? 0;
              const isPrimary =
                (allTournaments ?? []).find((row) => row.id === t.id)?.organizer_id === organizer.id;
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{t.name}</span>
                    <p className="text-xs text-[var(--muted)]">
                      {count} team{count === 1 ? "" : "s"}
                      {isPrimary ? " · primary organizer" : " · co-organizer"}
                    </p>
                  </div>
                  <Badge variant="accent">{t.status}</Badge>
                </li>
              );
            })}
          </ul>
        )}

        {assignableTournaments.length ? (
          <form action={assignOrganizerToTournamentFromProfile} className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <input type="hidden" name="organizer_id" value={organizer.id} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Link to tournament</span>
              <select
                name="tournament_id"
                required
                className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
                defaultValue=""
              >
                <option value="" disabled>Select tournament</option>
                {assignableTournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="set_primary" value="true" className="size-4 rounded border-stone-300" />
              <span>Set as primary organizer (owns this event)</span>
            </label>
            <SubmitButton pendingLabel="Linking…">Grant tournament access</SubmitButton>
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">This organizer is already on every tournament.</p>
        )}
      </Card>
    </div>
  );
}
