import type { FinancialLedgerEntryWithCreator, FinancialLedgerHistoryWithEditor, Profile } from "@/types/database";

type ProfileBits = Pick<Profile, "full_name" | "email">;

function profileBits(profile: ProfileBits | null | undefined): ProfileBits | null {
  if (!profile) return null;
  const name = profile.full_name?.trim();
  if (name) return { full_name: name, email: profile.email };
  if (profile.email) return { full_name: profile.full_name, email: profile.email };
  return null;
}

/** When PostgREST embed is blocked or empty, still show the signed-in user as creator/editor. */
export function enrichLedgerCreators(
  rows: FinancialLedgerEntryWithCreator[],
  self: Pick<Profile, "id" | "full_name" | "email">
): FinancialLedgerEntryWithCreator[] {
  const selfBits = profileBits(self);
  return rows.map((row) => {
    const embedded = profileBits(row.creator);
    if (embedded) return { ...row, creator: embedded };
    if (row.created_by === self.id && selfBits) {
      return { ...row, creator: selfBits };
    }
    return row;
  });
}

export function enrichLedgerHistoryEditors(
  rows: FinancialLedgerHistoryWithEditor[],
  self: Pick<Profile, "id" | "full_name" | "email">
): FinancialLedgerHistoryWithEditor[] {
  const selfBits = profileBits(self);
  return rows.map((row) => {
    const embedded = profileBits(row.editor);
    if (embedded) return { ...row, editor: embedded };
    if (row.changed_by === self.id && selfBits) {
      return { ...row, editor: selfBits };
    }
    return row;
  });
}
