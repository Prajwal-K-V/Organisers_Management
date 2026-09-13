import { describe, expect, it } from "vitest";
import { sumLedgerFlows } from "./dashboard-finance";

describe("sumLedgerFlows", () => {
  it("sums income and outgoing by entry type", () => {
    const totals = sumLedgerFlows([
      { entry_type: "opening_balance", amount: 1000 },
      { entry_type: "income", amount: 500 },
      { entry_type: "expense", amount: 200 },
      { entry_type: "bid", amount: -300 },
      { entry_type: "adjustment", amount: -50 },
    ]);
    expect(totals.income).toBe(1500);
    expect(totals.outgoing).toBe(550);
    expect(totals.net).toBe(950);
  });
});
