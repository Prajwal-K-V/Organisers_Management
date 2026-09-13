"use client";

import { useState } from "react";
import { createPlayer, deletePlayer } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PLAYING_ROLES } from "@/lib/players";
import type { Player } from "@/types/database";

export function PlayersManager({ tournamentId, players }: { tournamentId: string; players: Player[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar title="Players" count={players.length} addLabel="Add player" onAdd={() => setOpen(true)} />
      </Card>

      {!players.length ? (
        <EmptyState
          title="No players yet"
          description="Add players to the pool before starting the auction."
          action={
            <Button type="button" onClick={() => setOpen(true)}>
              + Add player
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {players.map((player) => (
              <li key={player.id}>
                <Card className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">
                      <span className="text-[var(--muted)]">{player.player_code}</span> {player.name}
                    </p>
                    <Badge variant={player.status === "sold" ? "success" : "accent"}>{player.status}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {player.role?.replace(/_/g, " ") ?? "—"} · Base {player.base_price}
                  </p>
                  <p className="text-sm">Sold for {player.sold_price ?? "—"}</p>
                  {player.status !== "sold" && (
                    <ConfirmSubmit action={deletePlayer.bind(null, tournamentId, player.id)} message={`Remove player “${player.name}”?`}>
                      <ConfirmDeleteButton label="Remove" />
                    </ConfirmSubmit>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <TableWrap>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Base</th>
                    <th>Status</th>
                    <th>Sold</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td className="text-[var(--muted)]">{player.player_code}</td>
                      <td className="font-medium">{player.name}</td>
                      <td className="capitalize">{player.role?.replace(/_/g, " ") ?? "—"}</td>
                      <td>{player.base_price}</td>
                      <td>
                        <Badge variant="accent">{player.status}</Badge>
                      </td>
                      <td>{player.sold_price ?? "—"}</td>
                      <td>
                        {player.status !== "sold" && (
                          <ConfirmSubmit action={deletePlayer.bind(null, tournamentId, player.id)} message={`Remove player “${player.name}”?`}>
                            <ConfirmDeleteButton />
                          </ConfirmSubmit>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add player" description="Base price is the minimum bid in the auction.">
        <form action={createPlayer.bind(null, tournamentId)} className="space-y-4" onSubmit={() => setOpen(false)}>
          <FieldGroup className="!grid-cols-1">
            <Field label="Player name" name="name" required placeholder="Full name" />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Playing role</span>
              <select
                name="role"
                className="rounded-lg border-2 border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm"
                defaultValue="all_rounder"
              >
                {PLAYING_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Base price" name="base_price" type="number" min={0} step={1} required placeholder="50000" />
          </FieldGroup>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Adding…">Save player</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
