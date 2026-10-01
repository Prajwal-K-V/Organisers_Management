"use client";

import { useState } from "react";
import {
  assignTournamentOrganizer,
  createTournament,
  repairTournamentOrganizerAccess,
  removeTournamentOrganizer,
  setTournamentOrganizerCanDeleteLedger,
} from "@/app/actions/admin";
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

type AssignedOrganizer = { profile_id: string; can_delete_ledger: boolean };

type Row = Tournament & { organizerLabel: string; assignedOrganizers: AssignedOrganizer[] };

function OrganizerSelect({
  organizers,
  name = "organizer_id",
  excludeIds = [],
  required = true,
}: {
  organizers: Pick<Profile, "id" | "full_name" | "email">[];
  name?: string;
  excludeIds?: string[];
  required?: boolean;
}) {
  const options = organizers.filter((o) => !excludeIds.includes(o.id));
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">Organizer</span>
      <select
        name={name}
        required={required}
        className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
        defaultValue=""
      >
        <option value="" disabled>Select organizer</option>
        {options.map((o) => (
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
  const [manageTournament, setManageTournament] = useState<Row | null>(null);
  const canAssign = organizers.length > 0;

  const organizerName = (id: string) => {
    const o = organizers.find((x) => x.id === id);
    return o ? o.full_name || o.email : "Unknown";
  };

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
                    onClick={() => setManageTournament(t)}
                  >
                    Manage organizers
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
                    <th>Organizers</th>
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
                          onClick={() => setManageTournament(t)}
                        >
                          Manage
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
            <Field label="Tournament name" name="name" required placeholder="Rajyotsava Cup 2026" />
            <OrganizerSelect organizers={organizers} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <SubmitButton pendingLabel="Creating…">Save tournament</SubmitButton>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={manageTournament !== null}
        onClose={() => setManageTournament(null)}
        title="Tournament organizers"
        description={
          manageTournament
            ? `Add or remove organizers for “${manageTournament.name}”. Once added, they automatically see teams, players, auction, and finance for this event.`
            : undefined
        }
      >
        {!canAssign || !manageTournament ? (
          <p className="text-sm text-[var(--muted)]">No active organizers available.</p>
        ) : (
          <div className="space-y-6">
            <ul className="space-y-2">
              {manageTournament.assignedOrganizers.map((assignment) => (
                <li
                  key={assignment.profile_id}
                  className="space-y-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{organizerName(assignment.profile_id)}</span>
                    <form action={removeTournamentOrganizer}>
                      <input type="hidden" name="tournament_id" value={manageTournament.id} />
                      <input type="hidden" name="organizer_id" value={assignment.profile_id} />
                      <SubmitButton
                        variant="secondary"
                        className="text-xs"
                        pendingLabel="Removing…"
                        disabled={manageTournament.assignedOrganizers.length <= 1}
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  </div>
                  <form action={setTournamentOrganizerCanDeleteLedger} className="flex items-center justify-between gap-2">
                    <input type="hidden" name="tournament_id" value={manageTournament.id} />
                    <input type="hidden" name="organizer_id" value={assignment.profile_id} />
                    <input
                      type="hidden"
                      name="can_delete_ledger"
                      value={assignment.can_delete_ledger ? "false" : "true"}
                    />
                    <p className="text-xs text-[var(--muted)]">
                      {assignment.can_delete_ledger
                        ? "Can delete ledger entries"
                        : "Cannot delete ledger entries"}
                    </p>
                    <SubmitButton variant="secondary" className="text-xs" pendingLabel="Saving…">
                      {assignment.can_delete_ledger ? "Revoke delete" : "Allow delete"}
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>

            <form action={repairTournamentOrganizerAccess} className="border-t border-[var(--border-subtle)] pt-4">
              <input type="hidden" name="tournament_id" value={manageTournament.id} />
              <p className="text-xs text-[var(--muted)]">
                If a primary organizer cannot see teams, sync their junction access from the tournament record.
              </p>
              <SubmitButton variant="secondary" className="mt-2 w-full sm:w-auto" pendingLabel="Syncing…">
                Repair organizer access
              </SubmitButton>
            </form>

            {manageTournament.assignedOrganizers.length < organizers.length ? (
              <form
                action={assignTournamentOrganizer}
                className="space-y-4 border-t border-[var(--border-subtle)] pt-4"
              >
                <input type="hidden" name="tournament_id" value={manageTournament.id} />
                <OrganizerSelect
                  organizers={organizers}
                  excludeIds={manageTournament.assignedOrganizers.map((a) => a.profile_id)}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setManageTournament(null)}>
                    Close
                  </Button>
                  <SubmitButton pendingLabel="Adding…">Add organizer</SubmitButton>
                </div>
              </form>
            ) : (
              <p className="text-sm text-[var(--muted)]">All active organizers are already on this tournament.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
