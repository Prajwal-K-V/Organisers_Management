"use client";

import Link from "next/link";
import { useState } from "react";
import { createTeam, deleteTeam, updateTeam } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { teamPurseRemaining } from "@/lib/team-roster";
import type { Player, Team } from "@/types/database";

function TeamForm({
  tournamentId,
  team,
  onDone,
}: {
  tournamentId: string;
  team?: Team;
  onDone: () => void;
}) {
  const isEdit = Boolean(team);
  const action = isEdit
    ? updateTeam.bind(null, tournamentId, team!.id)
    : createTeam.bind(null, tournamentId);

  return (
    <form action={action} className="space-y-4" onSubmit={onDone}>
      <FieldGroup className="!grid-cols-1">
        <Field
          label="Team name"
          name="name"
          required
          placeholder="e.g. Mumbai Strikers"
          defaultValue={team?.name ?? ""}
        />
        <Field
          label="Purse total"
          name="purse_total"
          type="number"
          min={0}
          step={1}
          required
          placeholder="1000000"
          hint="Remaining balance updates based on auction spend."
          defaultValue={team?.purse_total ?? undefined}
        />
      </FieldGroup>
      <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
          {isEdit ? "Save changes" : "Save team"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function TeamsManager({
  tournamentId,
  teams,
  players,
}: {
  tournamentId: string;
  teams: Team[];
  players: Pick<Player, "team_id" | "sold_price">[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const closeModals = () => {
    setAddOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <ListToolbar
          title="Teams"
          count={teams.length}
          addLabel="Add team"
          onAdd={() => setAddOpen(true)}
          extra={
            teams.length ? (
              <Link href={`/organizer/tournaments/${tournamentId}/team-view`} className="w-full sm:w-auto">
                <Button type="button" variant="secondary" className="w-full">
                  Team view & PDF
                </Button>
              </Link>
            ) : undefined
          }
        />
      </Card>

      {!teams.length ? (
        <EmptyState
          title="No teams yet"
          description="Add at least one team before running the auction."
          action={
            <Button type="button" onClick={() => setAddOpen(true)}>
              + Add team
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {teams.map((team) => {
            const remaining = teamPurseRemaining(team.purse_total, players, team.id);
            return (
              <li key={team.id}>
                <Card className="!p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-stone-900">{team.name}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:max-w-xs">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Purse</dt>
                          <dd className="font-semibold tabular-nums">{team.purse_total}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Remaining</dt>
                          <dd className="font-semibold tabular-nums text-[var(--primary)]">{remaining}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-stone-100 pt-3">
                    <Button type="button" variant="ghost" className="h-9 px-3 text-sm" onClick={() => setEditing(team)}>
                      Edit
                    </Button>
                    <ConfirmSubmit
                      action={deleteTeam.bind(null, tournamentId, team.id)}
                      message={`Delete team “${team.name}”? Players on this team will be unassigned.`}
                      className="inline"
                    >
                      <ConfirmDeleteButton label="Delete" className="!h-9 !px-3 !text-sm !font-semibold" />
                    </ConfirmSubmit>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={addOpen} onClose={closeModals} title="Add team" description="Set the total purse for this squad.">
        <TeamForm tournamentId={tournamentId} onDone={closeModals} />
      </Modal>

      <Modal open={Boolean(editing)} onClose={closeModals} title="Edit team" description="Update name or purse total.">
        {editing ? <TeamForm tournamentId={tournamentId} team={editing} onDone={closeModals} /> : null}
      </Modal>
    </div>
  );
}
