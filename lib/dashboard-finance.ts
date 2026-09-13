export type LedgerFlowRow = {
  entry_type: string;
  amount: number;
};

export type FinanceTotals = {
  income: number;
  outgoing: number;
  net: number;
};

/** Classify ledger rows into income vs outgoing for dashboard totals. */
export function sumLedgerFlows(rows: LedgerFlowRow[]): FinanceTotals {
  let income = 0;
  let outgoing = 0;

  for (const row of rows) {
    const amount = Number(row.amount);
    const type = row.entry_type;

    switch (type) {
      case "income":
      case "opening_balance":
        income += Math.abs(amount);
        break;
      case "refund":
        income += Math.abs(amount);
        break;
      case "expense":
      case "bid":
        outgoing += Math.abs(amount);
        break;
      case "adjustment":
        if (amount >= 0) income += amount;
        else outgoing += Math.abs(amount);
        break;
      default:
        if (amount >= 0) income += amount;
        else outgoing += Math.abs(amount);
    }
  }

  return { income, outgoing, net: income - outgoing };
}

export function formatCredits(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}
