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

export type BulkPlayerImportRow = {
  name: string;
  role: PlayingRole;
  basePrice: number;
};

const BULK_PLAYER_IMPORT_MAX_ROWS = 500;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ",") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function looksLikeHeader(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const joined = cells.join(" ").toLowerCase();
  return joined.includes("name") && (joined.includes("role") || joined.includes("base") || joined.includes("price"));
}

function parseBasePrice(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

/** Parse CSV or tab-separated bulk player text (name, role, base_price). */
export function parseBulkPlayerImport(text: string): {
  rows: BulkPlayerImportRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: BulkPlayerImportRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (!lines.length) {
    return { rows, errors: ["Paste or upload at least one player row."] };
  }

  let startIndex = 0;
  const firstCells = parseCsvLine(lines[0].includes("\t") ? lines[0].replace(/\t/g, ",") : lines[0]);
  if (looksLikeHeader(firstCells)) startIndex = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNo = i + 1;
    const normalized = lines[i].includes("\t") ? lines[i].replace(/\t/g, ",") : lines[i];
    const cells = parseCsvLine(normalized);
    if (!cells.some((c) => c.length > 0)) continue;

    const name = cells[0]?.trim() ?? "";
    if (!name) {
      errors.push(`Line ${lineNo}: player name is required.`);
      continue;
    }

    let roleRaw = "";
    let baseRaw = "0";

    if (cells.length === 1) {
      roleRaw = "";
      baseRaw = "0";
    } else if (cells.length === 2) {
      const second = cells[1] ?? "";
      if (/^\d/.test(second.replace(/,/g, "").trim())) {
        baseRaw = second;
      } else {
        roleRaw = second;
      }
    } else {
      roleRaw = cells[1] ?? "";
      baseRaw = cells[2] ?? "0";
    }

    const basePrice = parseBasePrice(baseRaw);
    if (basePrice === null) {
      errors.push(`Line ${lineNo}: invalid base price “${baseRaw}”.`);
      continue;
    }

    rows.push({
      name,
      role: normalizePlayingRole(roleRaw),
      basePrice,
    });
  }

  if (rows.length > BULK_PLAYER_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      errors: [`Import up to ${BULK_PLAYER_IMPORT_MAX_ROWS} players at a time (got ${rows.length}).`],
    };
  }

  return { rows, errors };
}

export function allocatePlayerCodes(existing: string[], count: number): string[] {
  if (count <= 0) return [];
  const first = nextPlayerCodeFromExisting(existing);
  const match = /^P(\d+)$/i.exec(first);
  const start = match ? Number.parseInt(match[1], 10) : 1;
  return Array.from({ length: count }, (_, i) => formatPlayerCode(start + i));
}
