"use client";

import { useState } from "react";
import { assignTournamentOrganizer, createTournament } from "@/app/actions/admin";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Profile, Tournament } from "@/types/database";

type Row = Tournament & { organizerLabel: string };

function OrganizerSelect({
  organizers,
  name = "organizer_id",
  defaultValue = "",
  required = true,
}: {
  organizers: Pick<Profile, "id" | "full_name" | "email">[];
  name?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">Organizer</span>
      <select
        name={name}
        required={required}
        className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
        defaultValue={defaultValue || ""}
      >
        <option value="" disabled>Select organizer</option>
        {organizers.map((o) => (
          <option key={o.id} value={o.id}>{o.full_name || o.email}</option>
        ))}
      </select>
    </label>
  );
}

export function AdminTournamentsManager({
  tournaments,
  organizers,
}: {
  tournaments: Row[];
  organizers: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTournament, setAssignTournament] = useState<Row | null>(null);
  const canAssign = organizers.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar
          title="Tournaments"
          count={tournaments.length}
          addLabel="Create tournament"
          onAdd={() => setCreateOpen(true)}
        />
      </Card>

      {!tournaments.length ? (
        <EmptyState
          title="No tournaments"
          description={canAssign ? "Create a tournament and pick an organizer." : "Activate an organizer first."}
          action={
            canAssign ? (
              <Button type="button" onClick={() => setCreateOpen(true)}>+ Create tournament</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Card className="space-y-3">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-[var(--muted)]">{t.organizerLabel}</p>
                    <Badge variant="accent" className="mt-2">{t.status}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={!canAssign}
                    onClick={() => setAssignTournament(t)}
                  >
                    Assign organizer
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <TableWrap>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Organizer</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>
                      <td>{t.organizerLabel}</td>
                      <td><Badge variant="accent">{t.status}</Badge></td>
                      <td>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs"
                          disabled={!canAssign}
                          onClick={() => setAssignTournament(t)}
                        >
                          Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create tournament"
        description="Pick the organizer who will manage this event."
      >
        {!canAssign ? (
          <p className="text-sm text-[var(--muted)]">Activate an organizer before creating tournaments.</p>
        ) : (
          <form action={createTournament} className="space-y-4" onSubmit={() => setCreateOpen(false)}>
            <Field label="Tournament name" name="name" required placeholder="Ratyotsava Cup 2026" />
            <OrganizerSelect organizers={organizers} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <SubmitButton pendingLabel="Creating…">Save tournament</SubmitButton>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={assignTournament !== null}
        onClose={() => setAssignTournament(null)}
        title="Assign organizer"
        description={assignTournament ? `Who should run “${assignTournament.name}”?` : undefined}
      >
        {!canAssign || !assignTournament ? (
          <p className="text-sm text-[var(--muted)]">No active organizers available.</p>
        ) : (
          <form
            action={assignTournamentOrganizer}
            className="space-y-4"
            onSubmit={() => setAssignTournament(null)}
          >
            <input type="hidden" name="tournament_id" value={assignTournament.id} />
            <OrganizerSelect organizers={organizers} defaultValue={assignTournament.organizer_id} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setAssignTournament(null)}>Cancel</Button>
              <SubmitButton pendingLabel="Saving…">Save assignment</SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
