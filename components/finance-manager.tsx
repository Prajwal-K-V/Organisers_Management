"use client";

import { useMemo, useState, type ReactNode } from "react";
import { addLedgerEntry, deleteLedgerEntry, updateLedgerEntry } from "@/app/actions/organizer";
import { ConfirmDeleteButton, ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

type FlowFilter = "all" | "income" | "expense";

type AddPreset = LedgerEntryType | "other";

function profileLabel(profile: { full_name: string | null; email: string } | null | undefined) {
  const name = profile?.full_name?.trim();
  if (name) return name;
  if (profile?.email) return profile.email;
  return "Unknown";
}

function formatLedgerWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LedgerTypeBadge({ row }: { row: FinancialLedgerEntryWithCreator }) {
  const tone = ledgerEntryTone(row.entry_type, Number(row.amount));
  const variant = tone === "income" ? "success" : tone === "expense" ? "danger" : "muted";
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      {formatLedgerEntryType(row.entry_type)}
    </Badge>
  );
}

function LedgerAmount({ row, size = "md" }: { row: FinancialLedgerEntryWithCreator; size?: "md" | "lg" }) {
  const tone = ledgerEntryTone(row.entry_type, Number(row.amount));
  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        size === "lg" ? "text-xl sm:text-2xl" : "text-base",
        tone === "income" && "text-[var(--success-text)]",
        tone === "expense" && "text-[var(--danger)]",
        tone === "neutral" && "text-[var(--foreground)]"
      )}
    >
      {formatCredits(Number(row.amount))}
    </span>
  );
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
  initialEntryType = "adjustment",
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
  const [entryType, setEntryType] = useState<LedgerEntryType>(entry?.entry_type ?? initialEntryType);

  return (
    <form action={action} className="space-y-5" onSubmit={onDone}>
      {!isEdit ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-800">What are you recording?</p>
          <div className="grid grid-cols-2 gap-2">
            {MANUAL_LEDGER_FORM_TYPES.map((type) => {
              const tone = ledgerEntryTone(type, type === "expense" ? -1 : 1);
              const selected = entryType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntryType(type)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm font-semibold transition",
                    selected
                      ? tone === "income"
                        ? "border-emerald-300 bg-[var(--success-bg)] text-[var(--success-text)] ring-2 ring-emerald-200"
                        : tone === "expense"
                          ? "border-red-200 bg-[var(--error-bg)] text-[var(--danger)] ring-2 ring-red-100"
                          : "border-amber-300 bg-[var(--accent-soft)] text-[var(--accent-foreground)] ring-2 ring-amber-100"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  {ENTRY_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="entry_type" value={entryType} />
        </div>
      ) : (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Entry type</span>
          <Select name="entry_type" defaultValue={entry?.entry_type ?? "adjustment"}>
            <option value="adjustment">Adjustment</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
            {showOpeningBalance ? <option value="opening_balance">Opening balance</option> : null}
          </Select>
        </label>
      )}

      <FieldGroup className="!grid-cols-1">
        <Field
          label="Amount"
          name="amount"
          type="number"
          step="0.01"
          required
          placeholder="0"
          defaultValue={entry?.amount ?? undefined}
          hint={entryType === "expense" ? "Enter as a positive number — it counts as money out." : undefined}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Team (optional)</span>
          <Select name="team_id" defaultValue={entry?.team_id ?? ""}>
            <option value="">No team linked</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </label>
        <Field
          label="Description"
          name="description"
          placeholder="e.g. Sponsor payment, venue deposit…"
          defaultValue={entry?.description ?? ""}
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
          {isEdit ? "Save changes" : "Add to ledger"}
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
    return <p className="text-sm text-[var(--muted)]">No edits yet — the current values are the original entry.</p>;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <ul className="space-y-2 text-sm">
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
          <li key={row.id} className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-stone-200/80">
            <p className="text-xs text-[var(--muted)]">
              {formatLedgerWhen(row.changed_at)} · {profileLabel(row.editor)}
            </p>
            <p className="mt-0.5 font-medium text-stone-800">{changes.length ? changes.join(" · ") : "Updated"}</p>
          </li>
        );
      })}
    </ul>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
        active
          ? "bg-stone-900 text-white shadow-sm"
          : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
      )}
    >
      {children}
    </button>
  );
}

function LedgerEntryCard({
  row,
  teamName,
  tournamentId,
  canDeleteLedger,
  history,
  historyOpen,
  onToggleHistory,
  onEdit,
}: {
  row: FinancialLedgerEntryWithCreator;
  teamName?: string;
  tournamentId: string;
  canDeleteLedger: boolean;
  history: FinancialLedgerHistoryWithEditor[];
  historyOpen: boolean;
  onToggleHistory: () => void;
  onEdit: () => void;
}) {
  const tone = ledgerEntryTone(row.entry_type, Number(row.amount));
  const editable = isEditableLedgerEntry(row.entry_type);
  const deletable = canDeleteLedger && isDeletableLedgerEntry(row.entry_type);

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/90 transition hover:shadow-md",
        tone === "income" && "ring-l-4 ring-l-emerald-400",
        tone === "expense" && "ring-l-4 ring-l-red-400"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <LedgerTypeBadge row={row} />
            {teamName ? (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{teamName}</span>
            ) : null}
          </div>
          <p className="text-sm text-stone-800">
            {row.description?.trim() || <span className="text-stone-400">No description</span>}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {formatLedgerWhen(row.created_at)} · Added by {profileLabel(row.creator)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <LedgerAmount row={row} size="lg" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-stone-100 pt-3">
        {editable ? (
          <Button type="button" variant="ghost" className="h-9 px-3 text-sm" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
        <Button type="button" variant="ghost" className="h-9 px-3 text-sm" onClick={onToggleHistory}>
          {historyOpen ? "Hide history" : history.length ? `History (${history.length})` : "History"}
        </Button>
        {deletable ? (
          <ConfirmSubmit
            action={deleteLedgerEntry.bind(null, tournamentId, row.id)}
            message="Delete this ledger entry? This cannot be undone."
            className="inline"
          >
            <ConfirmDeleteButton label="Delete" className="!h-9 !px-3 !text-sm !font-semibold" />
          </ConfirmSubmit>
        ) : null}
      </div>

      {historyOpen ? (
        <div className="mt-3 rounded-xl bg-stone-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Change log</p>
          <LedgerHistoryList history={history} current={row} />
        </div>
      ) : null}
    </article>
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
  const [addPreset, setAddPreset] = useState<AddPreset>("income");
  const [editing, setEditing] = useState<FinancialLedgerEntryWithCreator | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const totals = useMemo(() => sumLedgerFlows(ledger), [ledger]);

  const filteredLedger = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ledger.filter((row) => {
      const tone = ledgerEntryTone(row.entry_type, Number(row.amount));
      if (flowFilter === "income" && tone !== "income") return false;
      if (flowFilter === "expense" && tone !== "expense") return false;
      if (!q) return true;
      const haystack = [
        row.entry_type,
        formatLedgerEntryType(row.entry_type),
        row.description ?? "",
        profileLabel(row.creator),
        teamById.get(row.team_id ?? "") ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [ledger, query, flowFilter, teamById]);

  const openAdd = (preset: AddPreset) => {
    setAddPreset(preset);
    setAddOpen(true);
  };

  const closeModals = () => {
    setAddOpen(false);
    setEditing(null);
  };

  const addInitialType: LedgerEntryType =
    addPreset === "other" ? "adjustment" : addPreset === "income" || addPreset === "expense" ? addPreset : "adjustment";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="!p-4 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Money in</p>
          <p className="mt-1 text-2xl font-bold text-[var(--success-text)]">{formatCredits(totals.income)}</p>
        </Card>
        <Card className="!p-4 border-red-100 bg-gradient-to-br from-white to-red-50/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Money out</p>
          <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{formatCredits(totals.outgoing)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Net</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              totals.net >= 0 ? "text-[var(--success-text)]" : "text-[var(--danger)]"
            )}
          >
            {formatCredits(totals.net)}
          </p>
        </Card>
      </div>

      <Card className="space-y-4 !p-4 sm:!p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-stone-800">Search ledger</label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Description, type, team, or person…"
              aria-label="Search ledger entries"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={flowFilter === "all"} onClick={() => setFlowFilter("all")}>All</FilterChip>
            <FilterChip active={flowFilter === "income"} onClick={() => setFlowFilter("income")}>Income</FilterChip>
            <FilterChip active={flowFilter === "expense"} onClick={() => setFlowFilter("expense")}>Expense</FilterChip>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" className="w-full sm:w-auto" onClick={() => openAdd("income")}>
            + Record income
          </Button>
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => openAdd("expense")}>
            + Record expense
          </Button>
          <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => openAdd("other")}>
            Other entry
          </Button>
          {ledger.length ? (
            <a
              href={csvHref}
              download
              className="inline-flex h-[42px] w-full items-center justify-center rounded-lg px-4 text-sm font-semibold text-[var(--primary)] hover:bg-stone-50 sm:ml-auto sm:w-auto"
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </Card>

      {!ledger.length ? (
        <Card>
          <EmptyState
            title="No ledger entries yet"
            description="Start with income or an expense — you can add adjustments and refunds anytime."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={() => openAdd("income")}>Record income</Button>
                <Button type="button" variant="secondary" onClick={() => openAdd("expense")}>Record expense</Button>
              </div>
            }
          />
        </Card>
      ) : !filteredLedger.length ? (
        <Card className="py-10 text-center">
          <p className="font-medium text-stone-800">No entries match your search</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Try clearing filters or a different keyword.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => { setQuery(""); setFlowFilter("all"); }}>
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Showing {filteredLedger.length} of {ledger.length} {ledger.length === 1 ? "entry" : "entries"}
          </p>
          {filteredLedger.map((row) => (
            <LedgerEntryCard
              key={row.id}
              row={row}
              teamName={row.team_id ? teamById.get(row.team_id) : undefined}
              tournamentId={tournamentId}
              canDeleteLedger={canDeleteLedger}
              history={historyByLedgerId[row.id] ?? []}
              historyOpen={Boolean(expandedHistory[row.id])}
              onToggleHistory={() =>
                setExpandedHistory((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
              }
              onEdit={() => setEditing(row)}
            />
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={closeModals}
        title={addPreset === "income" ? "Record income" : addPreset === "expense" ? "Record expense" : "Add ledger entry"}
        description="Amounts update your tournament totals immediately."
      >
        <LedgerEntryForm
          tournamentId={tournamentId}
          teams={teams}
          initialEntryType={addInitialType}
          onDone={closeModals}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={closeModals}
        title="Edit entry"
        description="Previous values are kept in the change log."
      >
        {editing ? (
          <LedgerEntryForm tournamentId={tournamentId} teams={teams} entry={editing} onDone={closeModals} />
        ) : null}
      </Modal>
    </div>
  );
}
