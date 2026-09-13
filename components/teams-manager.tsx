"use client";

import Link from "next/link";
import { useState } from "react";
import { createTeam, deleteTeam } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { teamPurseRemaining } from "@/lib/team-roster";
import type { Player, Team } from "@/types/database";

export function TeamsManager({
  tournamentId,
  teams,
  players,
}: {
  tournamentId: string;
  teams: Team[];
  players: Pick<Player, "team_id" | "sold_price">[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <ListToolbar
          title="Teams"
          count={teams.length}
          addLabel="Add team"
          onAdd={() => setOpen(true)}
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
            <Button type="button" onClick={() => setOpen(true)}>
              + Add team
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {teams.map((team) => (
              <li key={team.id}>
                <Card className="space-y-3">
                  <p className="text-lg font-semibold">{team.name}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Purse</p>
                      <p className="font-medium">{team.purse_total}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Remaining</p>
                      <p className="font-semibold text-[var(--primary)]">
                        {teamPurseRemaining(team.purse_total, players, team.id)}
                      </p>
                    </div>
                  </div>
                  <ConfirmSubmit action={deleteTeam.bind(null, tournamentId, team.id)} message={`Remove team “${team.name}”?`}>
                    <ConfirmDeleteButton label="Remove" />
                  </ConfirmSubmit>
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
                    <th>Purse total</th>
                    <th>Remaining</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="font-medium">{team.name}</td>
                      <td>{team.purse_total}</td>
                      <td>{teamPurseRemaining(team.purse_total, players, team.id)}</td>
                      <td>
                        <ConfirmSubmit action={deleteTeam.bind(null, tournamentId, team.id)} message={`Remove team “${team.name}”?`}>
                          <ConfirmDeleteButton />
                        </ConfirmSubmit>
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
        open={open}
        onClose={() => setOpen(false)}
        title="Add team"
        description="Set the total purse — remaining balance updates during the auction."
      >
        <form action={createTeam.bind(null, tournamentId)} className="space-y-4" onSubmit={() => setOpen(false)}>
          <FieldGroup className="!grid-cols-1">
            <Field label="Team name" name="name" required placeholder="e.g. Mumbai Strikers" />
            <Field label="Purse total" name="purse_total" type="number" min={0} step={1} required placeholder="1000000" hint="Currency units for this tournament" />
          </FieldGroup>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Adding…">
              Save team
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
