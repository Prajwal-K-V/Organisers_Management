"use client";

import { useMemo, useState } from "react";
import { addLedgerEntry, deleteLedgerEntry, updateLedgerEntry } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatCredits, sumLedgerFlows } from "@/lib/dashboard-finance";
import {
  formatLedgerEntryType,
  isDeletableLedgerEntry,
  isEditableLedgerEntry,
  ledgerEntryTone,
  MANUAL_LEDGER_FORM_TYPES,
} from "@/lib/ledger";
import { cn } from "@/lib/utils";
import type {
  FinancialLedgerEntryWithCreator,
  FinancialLedgerHistoryWithEditor,
  LedgerEntryType,
  Team,
} from "@/types/database";

function profileLabel(profile: { full_name: string | null; email: string } | null | undefined) {
  const name = profile?.full_name?.trim();
  if (name) return name;
  if (profile?.email) return profile.email;
  return "Unknown";
}

function formatLedgerDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ENTRY_TYPE_LABELS: Record<(typeof MANUAL_LEDGER_FORM_TYPES)[number], string> = {
  income: "Income",
  expense: "Expense",
  adjustment: "Adjustment",
  refund: "Refund",
};

function LedgerEntryForm({
  tournamentId,
  teams,
  entry,
  initialEntryType = "income",
  onDone,
}: {
  tournamentId: string;
  teams: Team[];
  entry?: FinancialLedgerEntryWithCreator;
  initialEntryType?: LedgerEntryType;
  onDone: () => void;
}) {
  const isEdit = Boolean(entry);
  const action = isEdit
    ? updateLedgerEntry.bind(null, tournamentId, entry!.id)
    : addLedgerEntry.bind(null, tournamentId);
  const showOpeningBalance = entry?.entry_type === "opening_balance";

  return (
    <form action={action} className="space-y-4" onSubmit={onDone}>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Type</span>
        {isEdit ? (
          <Select name="entry_type" defaultValue={entry?.entry_type ?? "adjustment"}>
            <option value="adjustment">Adjustment</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
            {showOpeningBalance ? <option value="opening_balance">Opening balance</option> : null}
          </Select>
        ) : (
          <Select name="entry_type" defaultValue={initialEntryType}>
            {MANUAL_LEDGER_FORM_TYPES.map((type) => (
              <option key={type} value={type}>{ENTRY_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        )}
      </label>

      <FieldGroup className="!grid-cols-1">
        <Field
          label="Amount"
          name="amount"
          type="number"
          step="0.01"
          required
          placeholder="0"
          defaultValue={entry?.amount ?? undefined}
        />
        <Field
          label="Description"
          name="description"
          placeholder="What was this for?"
          defaultValue={entry?.description ?? ""}
        />
        {isEdit ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Team (optional)</span>
            <Select name="team_id" defaultValue={entry?.team_id ?? ""}>
              <option value="">None</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </label>
        ) : null}
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
          {isEdit ? "Save" : "Add"}
        </SubmitButton>
      </div>
    </form>
  );
}

function LedgerHistoryList({
  history,
  current,
}: {
  history: FinancialLedgerHistoryWithEditor[];
  current: FinancialLedgerEntryWithCreator;
}) {
  if (!history.length) {
    return <p className="text-sm text-[var(--muted)]">No edits recorded yet.</p>;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <ul className="space-y-2 text-sm text-[var(--muted)]">
      {sorted.map((row, index) => {
        const next =
          index === 0
            ? {
                entry_type: current.entry_type,
                amount: current.amount,
                description: current.description,
              }
            : {
                entry_type: sorted[index - 1].entry_type,
                amount: sorted[index - 1].amount,
                description: sorted[index - 1].description,
              };

        const changes: string[] = [];
        if (row.entry_type !== next.entry_type) {
          changes.push(`${formatLedgerEntryType(row.entry_type)} → ${formatLedgerEntryType(next.entry_type)}`);
        }
        if (Number(row.amount) !== Number(next.amount)) {
          changes.push(`${row.amount} → ${next.amount}`);
        }
        if ((row.description ?? "") !== (next.description ?? "")) {
          changes.push("description updated");
        }

        return (
          <li key={row.id}>
            {new Date(row.changed_at).toLocaleString()} · {profileLabel(row.editor)} —{" "}
            {changes.length ? changes.join(", ") : "Updated"}
          </li>
        );
      })}
    </ul>
  );
}

export function FinanceManager({
  tournamentId,
  teams,
  ledger,
  historyByLedgerId,
  canDeleteLedger,
  csvHref,
}: {
  tournamentId: string;
  teams: Team[];
  ledger: FinancialLedgerEntryWithCreator[];
  historyByLedgerId: Record<string, FinancialLedgerHistoryWithEditor[]>;
  canDeleteLedger: boolean;
  csvHref: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialLedgerEntryWithCreator | null>(null);

  const totals = useMemo(() => sumLedgerFlows(ledger), [ledger]);
  const sortedLedger = useMemo(
    () => [...ledger].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [ledger]
  );

  const closeModals = () => {
    setAddOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <Card className="!p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <dl className="grid grid-cols-3 gap-3 text-center sm:gap-6 sm:text-left">
            <div>
              <dt className="text-xs text-[var(--muted)]">In</dt>
              <dd className="text-lg font-bold text-[var(--success-text)] tabular-nums">{formatCredits(totals.income)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Out</dt>
              <dd className="text-lg font-bold text-[var(--danger)] tabular-nums">{formatCredits(totals.outgoing)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Net</dt>
              <dd
                className={cn(
                  "text-lg font-bold tabular-nums",
                  totals.net >= 0 ? "text-[var(--success-text)]" : "text-[var(--danger)]"
                )}
              >
                {formatCredits(totals.net)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setAddOpen(true)}>
              + Add entry
            </Button>
            {ledger.length ? (
              <a
                href={csvHref}
                download
                className="text-center text-sm font-medium text-[var(--primary)] hover:underline sm:px-2"
              >
                Export CSV
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      {!ledger.length ? (
        <Card>
          <EmptyState
            title="No entries yet"
            description="Add income, expenses, or adjustments for this tournament."
            action={
              <Button type="button" onClick={() => setAddOpen(true)}>+ Add entry</Button>
            }
          />
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <ul className="divide-y divide-[var(--border-subtle)]">
            {sortedLedger.map((row) => {
              const tone = ledgerEntryTone(row.entry_type, Number(row.amount));
              const editable = isEditableLedgerEntry(row.entry_type);
              const deletable = canDeleteLedger && isDeletableLedgerEntry(row.entry_type);
              const badgeVariant =
                tone === "income" ? "success" : tone === "expense" ? "danger" : "muted";

              return (
                <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={badgeVariant} className="normal-case tracking-normal">
                        {formatLedgerEntryType(row.entry_type)}
                      </Badge>
                      <span className="text-xs text-[var(--muted)]">{formatLedgerDate(row.created_at)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-stone-800">
                      {row.description?.trim() || "—"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        tone === "income" && "text-[var(--success-text)]",
                        tone === "expense" && "text-[var(--danger)]"
                      )}
                    >
                      {formatCredits(Number(row.amount))}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      {editable ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => setEditing(row)}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {deletable ? (
                        <ConfirmSubmit
                          action={deleteLedgerEntry.bind(null, tournamentId, row.id)}
                          message="Delete this entry?"
                          className="inline"
                        >
                          <ConfirmDeleteButton label="Delete" className="!h-8 !px-2 !text-xs !font-semibold" />
                        </ConfirmSubmit>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={addOpen} onClose={closeModals} title="Add entry">
        <LedgerEntryForm tournamentId={tournamentId} teams={teams} onDone={closeModals} />
      </Modal>

      <Modal open={Boolean(editing)} onClose={closeModals} title="Edit entry">
        {editing ? (
          <div className="space-y-5">
            <LedgerEntryForm tournamentId={tournamentId} teams={teams} entry={editing} onDone={closeModals} />
            <div className="border-t border-stone-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">History</p>
              <LedgerHistoryList history={historyByLedgerId[editing.id] ?? []} current={editing} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
