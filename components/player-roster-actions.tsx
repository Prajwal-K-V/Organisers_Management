"use client";

import { useState } from "react";
import { movePlayerToTeam, releasePlayerFromTeam } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { Player, Team } from "@/types/database";

export function PlayerRosterActions({
  tournamentId,
  player,
  teams,
  returnTo,
  compact = false,
}: {
  tournamentId: string;
  player: Player;
  teams: Team[];
  returnTo?: string;
  compact?: boolean;
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const sold = player.status === "sold" && player.team_id;

  if (!sold) return null;

  const otherTeams = teams.filter((t) => t.id !== player.team_id);
  const btnClass = compact ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" className={btnClass} onClick={() => setMoveOpen(true)}>
          Move to team
        </Button>
        <ConfirmSubmit
          action={releasePlayerFromTeam.bind(null, tournamentId, player.id)}
          message={`Remove ${player.name} from their team and return them to the player pool?`}
          className="inline"
        >
          <>
            {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
            <ConfirmDeleteButton
              label="Remove from team"
              className={`!font-semibold ${btnClass}`}
            />
          </>
        </ConfirmSubmit>
      </div>

      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title="Move player"
        description={`Transfer ${player.name} to another team at the same sale price (${player.sold_price}).`}
      >
        {otherTeams.length ? (
          <form
            action={movePlayerToTeam.bind(null, tournamentId, player.id)}
            className="space-y-4"
            onSubmit={() => setMoveOpen(false)}
          >
            {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">New team</span>
              <Select name="team_id" required defaultValue="">
                <option value="" disabled>Select team</option>
                {otherTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </label>
            <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setMoveOpen(false)}>Cancel</Button>
              <SubmitButton className="w-full sm:w-auto" pendingLabel="Moving…">Confirm move</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">Add another team before moving players between squads.</p>
        )}
      </Modal>
    </>
  );
}
