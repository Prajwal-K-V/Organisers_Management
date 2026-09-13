export const PLAYING_ROLES = ["batsman", "bowler", "all_rounder", "wicket_keeper"] as const;
export type PlayingRole = (typeof PLAYING_ROLES)[number];

export const DEFAULT_PLAYING_ROLE: PlayingRole = "all_rounder";

export function formatPlayerCode(sequence: number): string {
  const n = Math.max(1, Math.floor(sequence));
  return `P${String(n).padStart(3, "0")}`;
}

/** Next code from existing tournament player codes (P001, P002, …). */
export function nextPlayerCodeFromExisting(codes: string[]): string {
  let max = 0;
  let hasNumeric = false;
  for (const code of codes) {
    const match = /^P(\d+)$/i.exec(code.trim());
    if (match) {
      hasNumeric = true;
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  if (hasNumeric) return formatPlayerCode(max + 1);
  return formatPlayerCode(codes.length + 1);
}

export function normalizePlayingRole(raw: string | null | undefined): PlayingRole {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if ((PLAYING_ROLES as readonly string[]).includes(key)) return key as PlayingRole;
  return DEFAULT_PLAYING_ROLE;
}

export function buildPlayerInsertRow(args: {
  tournamentId: string;
  name: string;
  playerCode: string;
  basePrice: number;
  role?: string | null;
}) {
  return {
    tournament_id: args.tournamentId,
    name: args.name,
    player_code: args.playerCode,
    base_price: args.basePrice,
    status: "available" as const,
    team_id: null,
    sold_price: null,
    role: normalizePlayingRole(args.role),
  };
}

export function buildPlayerSoldUpdate(teamId: string, soldPrice: number) {
  return {
    status: "sold" as const,
    team_id: teamId,
    sold_price: soldPrice,
  };
}
