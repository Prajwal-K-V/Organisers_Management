"use client";

import { useState } from "react";
import { createPlayer, deletePlayer, updatePlayer } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { ListToolbar } from "@/components/list-toolbar";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PlayerRosterActions } from "@/components/player-roster-actions";
import { PLAYING_ROLES } from "@/lib/players";
import type { Player, Team } from "@/types/database";

function PlayerForm({
  tournamentId,
  player,
  onDone,
}: {
  tournamentId: string;
  player?: Player;
  onDone: () => void;
}) {
  const isEdit = Boolean(player);
  const sold = player?.status === "sold";
  const action = isEdit
    ? updatePlayer.bind(null, tournamentId, player!.id)
    : createPlayer.bind(null, tournamentId);

  return (
    <form action={action} className="space-y-4" onSubmit={onDone}>
      <FieldGroup className="!grid-cols-1">
        <Field label="Player name" name="name" required placeholder="Full name" defaultValue={player?.name ?? ""} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Playing role</span>
          <Select name="role" defaultValue={player?.role ?? "all_rounder"}>
            {PLAYING_ROLES.map((role) => (
              <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </label>
        <Field
          label="Base price"
          name="base_price"
          type="number"
          min={0}
          step={1}
          required={!sold}
          disabled={sold}
          placeholder="50000"
          defaultValue={player?.base_price ?? undefined}
          hint={sold ? "Sold players keep their auction price. Change name or role only." : undefined}
        />
      </FieldGroup>
      <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
          {isEdit ? "Save changes" : "Save player"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function PlayersManager({
  tournamentId,
  players,
  teams,
}: {
  tournamentId: string;
  players: Player[];
  teams: Team[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const closeModals = () => {
    setAddOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar title="Players" count={players.length} addLabel="Add player" onAdd={() => setAddOpen(true)} />
      </Card>

      {!players.length ? (
        <EmptyState
          title="No players yet"
          description="Add players to the pool before starting the auction."
          action={
            <Button type="button" onClick={() => setAddOpen(true)}>
              + Add player
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {players.map((player) => (
            <li key={player.id}>
              <Card className="!p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-stone-900">
                        <span className="text-[var(--muted)]">{player.player_code}</span> {player.name}
                      </p>
                      <Badge variant={player.status === "sold" ? "success" : "accent"} className="normal-case">
                        {player.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {player.role?.replace(/_/g, " ") ?? "—"} · Base {player.base_price}
                      {player.sold_price != null ? ` · Sold for ${player.sold_price}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-stone-100 pt-3">
                  <Button type="button" variant="ghost" className="h-9 px-3 text-sm" onClick={() => setEditing(player)}>
                    Edit
                  </Button>
                  {player.status === "sold" && player.team_id ? (
                    <PlayerRosterActions
                      tournamentId={tournamentId}
                      player={player}
                      teams={teams}
                      returnTo={`/organizer/tournaments/${tournamentId}/players`}
                    />
                  ) : null}
                  {player.status !== "sold" ? (
                    <ConfirmSubmit
                      action={deletePlayer.bind(null, tournamentId, player.id)}
                      message={`Delete player “${player.name}”? This cannot be undone.`}
                      className="inline"
                    >
                      <ConfirmDeleteButton label="Delete" className="!h-9 !px-3 !text-sm !font-semibold" />
                    </ConfirmSubmit>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={addOpen} onClose={closeModals} title="Add player" description="Base price is the minimum bid in the auction.">
        <PlayerForm tournamentId={tournamentId} onDone={closeModals} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={closeModals}
        title="Edit player"
        description={editing?.status === "sold" ? "Sold players: name and role only." : "Update player details."}
      >
        {editing ? <PlayerForm tournamentId={tournamentId} player={editing} onDone={closeModals} /> : null}
      </Modal>
    </div>
  );
}
