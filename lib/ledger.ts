import type { LedgerEntryType } from "@/types/database";

export const EDITABLE_LEDGER_ENTRY_TYPES: LedgerEntryType[] = [
  "adjustment",
  "income",
  "expense",
  "refund",
  "opening_balance",
];

export function isEditableLedgerEntry(entryType: LedgerEntryType) {
  return EDITABLE_LEDGER_ENTRY_TYPES.includes(entryType);
}

export function isDeletableLedgerEntry(entryType: LedgerEntryType) {
  return isEditableLedgerEntry(entryType);
}

export type LedgerFlowTone = "income" | "expense" | "neutral";

/** Matches dashboard finance classification (income vs outgoing). */
export function ledgerEntryTone(entryType: LedgerEntryType, amount: number): LedgerFlowTone {
  switch (entryType) {
    case "income":
    case "opening_balance":
    case "refund":
      return "income";
    case "expense":
    case "bid":
      return "expense";
    case "adjustment":
      return amount >= 0 ? "income" : "expense";
    default:
      return amount >= 0 ? "income" : "expense";
  }
}

export function formatLedgerEntryType(entryType: LedgerEntryType) {
  return entryType.replace(/_/g, " ");
}

/** Auction player points are tracked on teams/players, not in the finance ledger. */
export function isAuctionLedgerEntry(entryType: string) {
  return entryType === "bid";
}

export const MANUAL_LEDGER_FORM_TYPES: Exclude<
  LedgerEntryType,
  "bid" | "opening_balance"
>[] = ["adjustment", "income", "expense", "refund"];
