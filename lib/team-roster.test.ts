import { describe, expect, it } from "vitest";
import {
  buildTeamRosterExport,
  playersForTeam,
  squadSpend,
  teamPurseRemaining,
} from "./team-roster";
import type { Player, Team } from "@/types/database";

const team: Team = {
  id: "t1",
  tournament_id: "ev1",
  name: "Red Lions",
  purse_total: 1000,
  purse_remaining: 400,
  created_at: "",
  updated_at: "",
};

const players: Player[] = [
  {
    id: "p1",
    tournament_id: "ev1",
    team_id: "t1",
    player_code: "P001",
    name: "Alex",
    role: "batsman",
    base_price: 100,
    sold_price: 300,
    status: "sold",
    created_at: "",
    updated_at: "",
  },
  {
    id: "p2",
    tournament_id: "ev1",
    team_id: null,
    player_code: "P002",
    name: "Bob",
    role: "bowler",
    base_price: 50,
    sold_price: null,
    status: "available",
    created_at: "",
    updated_at: "",
  },
];

describe("team roster", () => {
  it("filters players by team", () => {
    expect(playersForTeam(players, "t1")).toHaveLength(1);
  });

  it("builds export payload with squad spend", () => {
    const roster = buildTeamRosterExport("Cup 2026", team, players);
    expect(roster.players).toHaveLength(1);
    expect(squadSpend(roster.players)).toBe(300);
    expect(roster.purseRemaining).toBe(700);
    expect(teamPurseRemaining(team.purse_total, players, team.id)).toBe(700);
  });
});
