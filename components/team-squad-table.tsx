"use client";

import { TableWrap } from "@/components/table-wrap";
import { PlayerRosterActions } from "@/components/player-roster-actions";
import type { Player, Team } from "@/types/database";

export function TeamSquadTable({
  tournamentId,
  players,
  teams,
  returnTo,
}: {
  tournamentId: string;
  players: Player[];
  teams: Team[];
  returnTo: string;
}) {
  if (!players.length) {
    return <p className="text-sm text-[var(--muted)]">No players assigned to this team yet.</p>;
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {players.map((player) => (
          <li key={player.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
            <p className="font-semibold">
              <span className="text-[var(--muted)]">{player.player_code}</span> {player.name}
            </p>
            <p className="mt-1 capitalize text-[var(--muted)]">
              {player.role?.replace(/_/g, " ") ?? "—"} · Sold for {player.sold_price ?? "—"}
            </p>
            <div className="mt-3 border-t border-stone-100 pt-2">
              <PlayerRosterActions
                tournamentId={tournamentId}
                player={player}
                teams={teams}
                returnTo={returnTo}
                compact
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <TableWrap>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Role</th>
                <th>Base</th>
                <th>Sold for</th>
                <th className="w-[1%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="text-[var(--muted)]">{player.player_code}</td>
                  <td className="font-medium">{player.name}</td>
                  <td className="capitalize">{player.role?.replace(/_/g, " ") ?? "—"}</td>
                  <td>{player.base_price}</td>
                  <td>{player.sold_price ?? "—"}</td>
                  <td>
                    <PlayerRosterActions
                      tournamentId={tournamentId}
                      player={player}
                      teams={teams}
                      returnTo={returnTo}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </>
  );
}
