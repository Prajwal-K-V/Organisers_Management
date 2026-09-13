import { describe, expect, it } from "vitest";
import {
  buildPlayerInsertRow,
  buildPlayerSoldUpdate,
  formatPlayerCode,
  nextPlayerCodeFromExisting,
  normalizePlayingRole,
} from "./players";

describe("formatPlayerCode", () => {
  it("pads sequence numbers", () => {
    expect(formatPlayerCode(1)).toBe("P001");
    expect(formatPlayerCode(42)).toBe("P042");
  });
});

describe("nextPlayerCodeFromExisting", () => {
  it("uses the next number after the highest P-code", () => {
    expect(nextPlayerCodeFromExisting(["P001", "P003", "P010"])).toBe("P011");
  });

  it("starts at P001 when the pool is empty", () => {
    expect(nextPlayerCodeFromExisting([])).toBe("P001");
  });

  it("falls back to pool size when codes are not P-numbered", () => {
    expect(nextPlayerCodeFromExisting(["LOT-A", "LOT-B"])).toBe("P003");
  });
});

describe("normalizePlayingRole", () => {
  it("normalizes labels and defaults unknown values", () => {
    expect(normalizePlayingRole("Wicket Keeper")).toBe("wicket_keeper");
    expect(normalizePlayingRole("")).toBe("all_rounder");
  });
});

describe("buildPlayerInsertRow", () => {
  it("includes role and auction status for inserts", () => {
    expect(
      buildPlayerInsertRow({
        tournamentId: "t1",
        name: "Test",
        playerCode: "P001",
        basePrice: 100,
        role: "batsman",
      })
    ).toMatchObject({
      tournament_id: "t1",
      player_code: "P001",
      role: "batsman",
      status: "available",
      team_id: null,
      sold_price: null,
    });
  });
});

describe("buildPlayerSoldUpdate", () => {
  it("sets sold status with team and price together", () => {
    expect(buildPlayerSoldUpdate("team-1", 5000)).toEqual({
      status: "sold",
      team_id: "team-1",
      sold_price: 5000,
    });
  });
});
