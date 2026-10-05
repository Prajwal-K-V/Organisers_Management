"use client";

import { useState } from "react";
import { bulkCreatePlayers, createPlayer, deletePlayer, updatePlayer } from "@/app/actions/organizer";
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

const BULK_PLAYER_TEMPLATE = `name,role,base_price
Amit Sharma,batsman,50000
Ravi Kumar,all_rounder,75000
`;

function BulkPlayerUploadForm({
  tournamentId,
  onDone,
}: {
  tournamentId: string;
  onDone: () => void;
}) {
  const action = bulkCreatePlayers.bind(null, tournamentId);
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(BULK_PLAYER_TEMPLATE)}`;

  return (
    <form action={action} className="space-y-4" encType="multipart/form-data" onSubmit={onDone}>
      <p className="text-sm text-[var(--muted)]">
        Upload a CSV or paste rows with columns{" "}
        <span className="font-medium text-stone-700">name, role, base_price</span>. Role can be batsman, bowler,
        all_rounder, or wicket_keeper. Header row is optional.
      </p>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">CSV file</span>
        <input
          type="file"
          name="bulk_file"
          accept=".csv,text/csv,text/plain"
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--primary)]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Or paste rows</span>
        <textarea
          name="bulk_text"
          rows={8}
          placeholder={BULK_PLAYER_TEMPLATE.trim()}
          className="w-full rounded-xl border-2 border-[var(--border-subtle)] bg-white px-3 py-2 font-mono text-sm text-stone-800 shadow-sm focus:border-[var(--primary)] focus:outline-none"
        />
      </label>
      <a href={templateHref} download="players-template.csv" className="text-sm font-medium text-[var(--primary)] hover:underline">
        Download sample CSV
      </a>
      <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Importing…">Import players</SubmitButton>
      </div>
    </form>
  );
}

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const closeModals = () => {
    setAddOpen(false);
    setBulkOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <ListToolbar
          title="Players"
          count={players.length}
          addLabel="Add player"
          onAdd={() => setAddOpen(true)}
          extra={
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setBulkOpen(true)}>
              Bulk upload
            </Button>
          }
        />
      </Card>

      {!players.length ? (
        <EmptyState
          title="No players yet"
          description="Add players to the pool before starting the auction."
          action={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" onClick={() => setAddOpen(true)}>+ Add player</Button>
              <Button type="button" variant="secondary" onClick={() => setBulkOpen(true)}>Bulk upload</Button>
            </div>
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

      <Modal open={bulkOpen} onClose={closeModals} title="Bulk upload players" description="Import many players at once from CSV or pasted text.">
        <BulkPlayerUploadForm tournamentId={tournamentId} onDone={closeModals} />
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
