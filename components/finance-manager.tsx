"use client";

import { useState } from "react";
import { addLedgerEntry } from "@/app/actions/organizer";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { TableWrap } from "@/components/table-wrap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { FinancialLedgerEntry, Team } from "@/types/database";

export function FinanceManager({
  tournamentId,
  teams,
  ledger,
  csvHref,
}: {
  tournamentId: string;
  teams: Team[];
  ledger: FinancialLedgerEntry[];
  csvHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ledger</h2>
            <p className="text-sm text-[var(--muted)]">{ledger.length === 1 ? "1 entry" : `${ledger.length} entries`}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {ledger.length ? (
              <a
                href={csvHref}
                download
                className="inline-flex h-[42px] items-center justify-center rounded-lg border-2 border-[var(--border-subtle)] bg-white px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]"
              >
                Export CSV
              </a>
            ) : null}
            <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(true)}>+ Add entry</Button>
          </div>
        </div>

        {!ledger.length ? (
          <EmptyState
            title="No ledger entries"
            description="Add income, expenses, adjustments, or refunds as needed."
            action={
              <Button type="button" onClick={() => setOpen(true)}>+ Add entry</Button>
            }
          />
        ) : (
          <>
            <ul className="space-y-3 md:hidden">
              {ledger.map((row) => (
                <li key={row.id}>
                  <div className="rounded-xl border-2 border-[var(--border-subtle)] bg-white p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold capitalize">{row.entry_type}</span>
                      <span className="font-bold text-[var(--primary)]">{row.amount}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleString()}</p>
                    {row.description ? <p className="mt-2 text-[var(--foreground)]">{row.description}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <TableWrap>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                        <td>{row.entry_type}</td>
                        <td className="font-medium">{row.amount}</td>
                        <td>{row.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Manual entry" description="Adjustments, income, expenses, and refunds.">
        <form action={addLedgerEntry.bind(null, tournamentId)} className="space-y-4" onSubmit={() => setOpen(false)}>
          <FieldGroup className="!grid-cols-1">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Team (optional)</span>
              <Select name="team_id" defaultValue="">
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Entry type</span>
              <Select name="entry_type" defaultValue="adjustment">
                <option value="adjustment">Adjustment</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="refund">Refund</option>
              </Select>
            </label>
            <Field label="Amount" name="amount" type="number" step="0.01" required placeholder="+ or - value" />
            <Field label="Description" name="description" placeholder="What is this entry for?" />
          </FieldGroup>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">Save entry</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
